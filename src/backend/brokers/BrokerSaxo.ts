import { Global } from "@backend/Global";
import * as lib from "@backend/brokers/index";

export class BrokerSaxo extends Global {
  constructor() {
    super();
    this.api = new lib.SaxoApi();
    this.accts = new lib.AccountsSaxo();
    this.instruments = new lib.InstrumentsSaxo();
    this.transctns = new lib.TransactionsSaxo();
    this.live_data = new lib.LiveDataSaxo();
    this.auth = new lib.AuthSaxo();
  }

  public update_accounts = () => this.update.accounts();
  public update_instruments = () => this.update.instruments();
  public update_transactions = () => this.update.transactions();
  public balances = async (fx: lv.forex[]) => this.accts.balances(fx);
  public await_auth = () => this.auth.await_auth();
  public logout = () => this.auth.logout();
  public fetch_auth_url = () => this.auth.fetch_code_url();
  public fetch_token = (code: string) => this.auth.fetch_token(code);
  public chart_data = (...p: pr.chart_period) => {
    return this.live_data.fetch_chart_data(...p);
  };
  public get auth_state() {
    return this.auth.state;
  }
  public get auth_bearer() {
    return this.auth.auth_token.access_token;
  }
  public get broker_auth() {
    return this.auth;
  }
  public get client_key() {
    if (!this._client_key) throw Error("Client key must be set");
    return this._client_key;
  }
  public set client_key(key: string) {
    this._client_key = key;
  }

  private update = {
    accounts: async () => {
      const { broker_auth, accts: accounts, db, bootstrap } = this;
      await broker_auth
        .fetch_client_key()
        .then((key) => (this.client_key = key))
        .then(() => accounts.update())
        .then(db.insert.accounts)
        .then(() => bootstrap("SAXO accounts updated"));
    },

    instruments: async () => {
      const { bootstrap, instruments, db } = this;
      return instruments
        .update()
        .then(db.insert.instrumnts)
        .then(() => bootstrap("SAXO instruments updated"));
    },
    transactions: async () => {
      const { db, bootstrap, transctns } = this;

      return transctns
        .last_update_date()
        .then(transctns.update)
        .then(db.insert.transctns.data)
        .then(() => bootstrap("SAXO transactions updated"));
    },
  };
  public api: lib.SaxoApi;
  public auth: lib.AuthSaxo;
  private accts: lib.AccountsSaxo;
  private instruments: lib.InstrumentsSaxo;
  private transctns: lib.TransactionsSaxo;
  private live_data: lib.LiveDataSaxo;
  private _client_key?: string;
}

//balances: async () => {
//  const { db, accts } = this;
//  db.select.accounts(["broker", "saxo"]).then(accts.balances);
//  //const { balances } = this.accounts;
//  //const { cache, brokers } = this;
//  //const balances = await this.accounts.balances(this.cache.accounts);
//  //brokers.cache.live_data_balances = await cache.accounts.then(balances);
//  //logger.json("SAXO balances", balances);
//},
