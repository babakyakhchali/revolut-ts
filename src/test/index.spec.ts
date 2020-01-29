import * as dotenv from "dotenv";
dotenv.config();
import { Revolut } from "../rev"
import { parse } from "url";
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { expect } from "chai";
import { randomBytes } from "crypto";

export async function testToken(r: Revolut) {
    const redUrl = process.env.RED_URL!;
    const ppath = resolve('./keys/privatekey.pem');
    const publicKey = readFileSync(ppath).toString();
    const issuer = parse(redUrl).host;
    const token = r.createJwtToken(process.env.CLIENT_ID!, issuer!, publicKey);
    let accessToken = process.env.ACCESS_TOKEN;
    if (!accessToken) {
        let rr = await r.refreshToken(process.env.CLIENT_ID!, token, process.env.REFRESH_TOKEN!);
        writeFileSync('./lastToken.json', JSON.stringify(rr));        
        expect(rr.access_token).to.be.a('string');
        accessToken = rr.access_token;
    }
    r.token = accessToken;
}
export async function testPay(r: Revolut) {
    let accounts = await r.getAccounts();    
    expect(accounts).to.be.a('array');
    let account = accounts[0];

    let cps = await r.getCounterparties();
    let party = cps.find(cp=>cp.profile_type); 
    expect(party).to.be.an('object');
    expect(cps).to.be.a('array');
    let reqId = randomBytes(20).toString('hex')
    let payment = await r.pay({
        amount: 10, currency: 'EUR', request_id: reqId,
        receiver: { counterparty_id: party!.id },
        account_id: account.id, reference: 'Payment description',
        schedule_for:(new Date(Date.now()+(1000*24*3600))).toISOString().substr(0,10)
    })
    expect(payment).to.be.an('object'); 
    const p2 = await r.getTransaction(payment.id);
    const p3 = await r.getTransactionByRequestId(reqId);
    expect(p2.id).to.be.eq(p3.id).to.be.eq(payment.id);  
    await r.delTransaction(payment.id);  
    const p4 = await r.getTransaction(payment.id);
    expect(p4).to.be.an('object'); 
    let txs = await r.getTransactions({});
    expect(txs).to.be.a('array');
}

export async function testWeb(r: Revolut) {
    let url = 'https://babak.loc';
    await r.setWebHook(url);
    let rr = await r.getWebHook();
    expect(rr.url).to.be.eq(url);
}

export async function testCp(r: Revolut) {
    let cps = await r.getCounterparties();
    expect(cps).to.be.a('array');
    let cp1 = await r.addRevCounterparty({ name: 'test', profile_type: 'personal', phone: "+4412345678900" });
    expect(cp1).to.be.a('object');
    let cp1_1 = await r.getCounterparty(cp1.id);
    expect(cp1.id).to.be.eq(cp1_1.id);
    await r.deleteCounterParty(cp1.id);
    try {
        cp1 = await r.getCounterparty(cp1.id);
    } catch (error) {
        expect(error.error.code).to.be.eq(3006);
    }
    let cp2 = await r.addIbanCounterparty({
        bank_country: 'LT', bic: 'BARCGB22', currency: 'EUR', iban: 'GB73 BARC 2036 4759 2458 33', individual_name: {
            first_name: 'boby', last_name: 'charry'
        }
    })
    expect(cp2).to.be.a('object');
    let cp2_2 = await r.getCounterparty(cp2.id);
    expect(cp2.id).to.be.eq(cp2_2.id);
    await r.deleteCounterParty(cp2.id);
    try {
        cp2 = await r.getCounterparty(cp2.id);
    } catch (error) {
        expect(error.error.code).to.be.eq(3006);
    }
}

describe('Testing token and counterparties', async function () {
    this.timeout(60 * 1000);
    const r = new Revolut('sandbox');
    it('Should get a token', async function () {
        await testToken(r);
    })
    // it('should test Counterparties', async function () {
    //     await testCp(r);
    // })
    it('Should test payment', async function () {
        await testPay(r);
    })
    // it('Should test webhook', async function () {
    //     await testWeb(r);
    // })
})