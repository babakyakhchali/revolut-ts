export type RevolutEnv = 'sandbox' | 'production';

export interface IRevolutCreatePayment {
	request_id: string;
	account_id?: string;
	receiver: {
		counterparty_id: string;
		account_id?: string;
	}
	amount: number;
	currency: string;
	reference: string;
	schedule_for?:string;
}

export interface IRevolutEvent {
	event: string;
	timestamp: Date;
	data: {
		id: string;
		type: string;
		request_id: string;
		state: string;
		created_at: Date;
		updated_at: Date;
		completed_at: Date;
		reference: string;
		legs: ILeg[];
		old_state: string,
		new_state: string
	}
}
export interface ILeg {
	leg_id: string;
	account_id: string;
	counterparty: {
		id: string;
		type: 'self' | 'revolut' | 'external';
		account_id: string;
	};
	amount: number;
	currency: string;
	description: string;
	balance: number;
	bill_amount: number;
	bill_currency: string;
}

export enum RevolutTransactionStateEnum {
	PENDING = 'pending', COMPLETED = 'completed', DECLINED = 'declined', FAILED = 'failed', CREATED = 'created'
};

export interface IRevolutTransaction {
	id: string;
	state: RevolutTransactionStateEnum;
	created_at: Date;
	type?: 'atm' | 'card_payment' | 'card_refund' | 'card_chargeback' | 'card_credit' | 'exchange' | 'transfer' | 'loan' | 'fee' | 'refund' | 'topup' | 'topup_return' | 'tax' | 'tax_refund';
	request_id?: string;
	reason_code?: string;
	updated_at?: Date;
	completed_at?: Date;
	scheduled_for?: Date;
	merchant?: {
		name: string;
		city: string,
		category_code: string,
		country: string
	},
	reference?: string;
	/*the legs of transaction, there'll be 2 legs between your Revolut accounts and 1 leg in other cases */
	legs?: ILeg[];
	card?: {
		card_number: string,
		first_name: string,
		last_name: string,
		phone: string;
	};
}

export interface IRevolutOAuthResponse {
	access_token: string;
	token_type: string;
	expires_in: number;
	refresh_token?: string;		
}

export interface IRevolutCounterparty {
	id: string;
	name: string;
	phone: string;
	profile_type: 'personal' | 'business';
	country: string;
	state: string;
	created_at: string;
	updated_at: string;
	accounts: IRevolutCounterpartyAccount[];
}

export interface IRevolutCounterpartyAccount {
	id: string;
	currency: string;
	type: 'revolut' | 'external';
	email?: string;	
	account_no?: string;
	sort_code?: string;	
	name: string;
	bank_country: string;
	recipient_charges?: string;
	iban?: string;
	bic?: string;
	balance: number,
}

export interface IRevolutAddress {
	street_line1?: string;
	street_line2?: string;
	region?: string;
	postcode?: string;
	city?: string;
	country?: string;
}

export interface ICreateRevCounterparty {
	profile_type: 'business' | 'personal';
	/**
	 * an optional name. Provide only with personal profile_type
	 */
	name: string;
	phone: string;
	email?: string; //an optional email address of an admin of a public Revolut Business account. Provide only with business profile_type.
}

export interface ICreateIbanCounterparty extends  ICreateNonRevCounterparty{
	currency:'EUR';
	iban:string;
	bic:string;
}

export interface ICreateGbpCounterparty extends  ICreateNonRevCounterparty{
	currency:'GBP';
	account_no:string;
	sort_code:string;
}

export interface ICreateUsdCounterparty extends ICreateNonRevCounterparty{
	currency:'USD';
	routing_number:string;
	account_no:string;
}

export interface ICreateSwiftCounterparty extends ICreateNonRevCounterparty {
	account_no:string;
	bic:string;
}

export interface ICreateNonRevCounterparty  {
	company_name?: string;//an optional name of the external company counterparty, this field must exist when individual_name does not	
	individual_name?: {
		first_name: string;	//an optional first name of the external individual counterparty, this field must exist when company_name does not
		last_name: string;//an optional last name of the external individual counterparty, this field must exist when company_name does not
	}
	bank_country: string;
	currency: string;	
	email?: string;
	phone?: string;
	address?: IRevolutAddress;
}

export interface IRevolutError {	
	message:string,
	code:number;
}

export interface IRevolutWebhook {
	url:string;
}

export interface IRevolutAccount {
	id: string;
	name: string;
	balance: number;
	currency: string;
	state: string;
	public: boolean;
	created_at: Date;
	updated_at: Date;
}