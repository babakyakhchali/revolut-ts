import { sign } from "jsonwebtoken";
import { stringify } from "querystring";
import { post, del, get } from "request-promise";
import { IRevolutTransaction, IRevolutCreatePayment, IRevolutCounterparty, ICreateRevCounterparty, ICreateIbanCounterparty, IRevolutWebhook, RevolutEnv, IRevolutAccount, IRevolutOAuthResponse } from "./i";

const SANDBOX_URL = 'https://sandbox-b2b.revolut.com/api/1.0'
const PRODUCTION_URL = 'https://b2b.revolut.com/api/1.0'
const baseOpts = {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    json: true
}

export class Revolut {
    private _token: string;    
    constructor(private env: RevolutEnv) {
        this._token = '';
    }
    private getOpts( body?: any) {
        let data: any = {
            headers: { Authorization: `Bearer ${this._token}` },
            json: true,
            timeout: 5 * 1000
        };
        if (body) {
            data.body = body;
        }
        return data;
    }
    set token(t:string){
        this._token = t;
    }    
    get baseUrl() {
        return this.env == 'sandbox' ? SANDBOX_URL : PRODUCTION_URL;
    }

    createJwtToken(clientId: string, issuer: string, privateKey: string){        
        const aud = 'https://revolut.com' // Constant	
        const payload = {
            "iss": issuer,
            "sub": clientId,
            "aud": aud
        }

        return sign(payload, privateKey, { algorithm: 'RS256', expiresIn: 60 * 60 });
    }

    async getToken(clientId: string, code: string,jwtToken:string):Promise<IRevolutOAuthResponse> {
        const tokenUrl = `${this.baseUrl}/auth/token`; 
        
        const opts = {
            body: stringify({
                "grant_type": "authorization_code",
                "code": code,
                "client_assertion_type": "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
                "client_id": clientId,
                "client_assertion": jwtToken,
            }),
            ...baseOpts
        };
        return post(tokenUrl, opts).promise();        
    }

    async refreshToken(clientId: string, myJwtToken: string, refreshToken: string): Promise<IRevolutOAuthResponse> {
        const tokenUrl = `${this.baseUrl}/auth/token` // should be changed to production url	  
        const opts = {
            body: stringify({
                "grant_type": "refresh_token",
                "refresh_token": refreshToken,
                "client_id": clientId,
                "client_assertion_type": "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
                "client_assertion": myJwtToken,
            }),
            ...baseOpts
        };
        return post(tokenUrl, opts).promise();
    }

    setWebHook(url: string) {
        return post(`${this.baseUrl}/webhook`, this.getOpts({ url })).promise();
    }

    delWebHook() {        
        return del(`${this.baseUrl}/webhook`, this.getOpts()).promise();
    }

    getWebHook():Promise<IRevolutWebhook> {
        return get(`${this.baseUrl}/webhook`, this.getOpts()).promise();
    }

    getAccounts():Promise<IRevolutAccount[]> {
        return get(`${this.baseUrl}/accounts`, this.getOpts()).promise();
    }

    getAccount(id: string):Promise<IRevolutAccount> {        
        return get(`${this.baseUrl}/accounts/${id}`, this.getOpts()).promise();
    }

    getAccountDetail(id: string) {
        return get(`${this.baseUrl}/accounts/${id}/bank-details`, this.getOpts()).promise();
    }

    pay(p: IRevolutCreatePayment): Promise<IRevolutTransaction> {
        return post(`${this.baseUrl}/pay`, this.getOpts(p)).promise();
    }
    getTransactions(s:IGetTransactionsQuery):Promise<IRevolutTransaction[]> {        
        return get(`${this.baseUrl}/transactions?${stringify(s)}`, this.getOpts()).promise();
    }
    getTransaction(id:string):Promise<IRevolutTransaction>{
        return get(`${this.baseUrl}/transaction/${id}`, this.getOpts()).promise();
    }
    getTransactionByRequestId(reqId:string):Promise<IRevolutTransaction>{
        return get(`${this.baseUrl}/transaction/${reqId}?id_type=request_id`, this.getOpts()).promise();
    }
    /**
     * 
     * @param id delete scheduled transactions
     */
    delTransaction(id:string){
        return del(`${this.baseUrl}/transaction/${id}`, this.getOpts()).promise();
    }
    getCounterparties():Promise<IRevolutCounterparty[]>{        
        return get(`${this.baseUrl}/counterparties`, this.getOpts()).promise();
    }
    getCounterparty(id:string):Promise<IRevolutCounterparty>{        
        return get(`${this.baseUrl}/counterparty/${id}`, this.getOpts()).promise();
    }    
    addRevCounterparty(data:ICreateRevCounterparty):Promise<IRevolutCounterparty>{
        return post(`${this.baseUrl}/counterparty`, this.getOpts(data)).promise();
    }
    addIbanCounterparty(data:ICreateIbanCounterparty):Promise<IRevolutCounterparty>{
        return post(`${this.baseUrl}/counterparty`, this.getOpts(data)).promise();
    }
    deleteCounterParty(id:string):Promise<any>{
        return del(`${this.baseUrl}/counterparty/${id}`, this.getOpts()).promise();
    }
    

}
export interface IGetTransactionsQuery {
    from?: string;
    to?: string;
    counterparty?: string;
    count?: number;
    type?: string;
}
export class RevollutCounterParty {
	phone: any;
	name: any;
	profile_type: string | undefined;
	individual_name: { first_name: string | undefined; last_name: string | undefined; } | undefined;
	bank_country: string | undefined;
	currency: string | undefined;
	iban: string | undefined;
	bic: string | undefined;
	constructor(phone?: string, name?: string, family?: string, bankCountry?: string, currency?: string, iban?: string, bic?: string) {
		if (phone) {
			this.profile_type = 'personal';
			this.name = name;
			this.phone = phone;
		} else {
			this.individual_name = {
				first_name: name,
				last_name: family
			};
			this.bank_country = bankCountry;
			this.currency = currency;
			this.iban = iban;
			this.bic = bic;
		}
	}
}