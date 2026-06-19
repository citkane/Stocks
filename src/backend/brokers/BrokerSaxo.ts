import { Global } from "@backend/Global";
import * as lib from "@backend/brokers/index";

export class BrokerSaxo extends Global {
  constructor() {
    super();
    this.cache = new lib.CacheSaxo();
    this.api = new lib.SaxoApi();
    this.accounts = new lib.AccountsSaxo();
    this.instruments = new lib.PositionsSaxo();
    this.transactions = new lib.TransactionsSaxo();
    this.live_data = new lib.LiveDataSaxo();
    this.auth = new lib.AuthSaxo();
  }

  public chart_data = (...p: p.chart_period) => {
    return this.live_data.fetch_chart_data(...p);
  };
  public acc_balances = async () => {
    if (!this.auth_state) return {};
    const accounts = await this.cache.accounts;
    return this.accounts.balances(accounts);
  };

  public update = {
    accounts: () => this._update.accounts(),
    instruments: () => this._update.instruments(),
    transactions: () => this._update.transactions(),
    //account_balances: () => this._update.balances(),
  };

  public await_auth = () => this.auth.await_auth();
  public logout = () => this.auth.logout();
  public fetch_auth_url = () => this.auth.fetch_code_url();
  public fetch_token = (code: string) => this.auth.fetch_token(code);

  public get auth_bearer() {
    return this.auth.auth_token.access_token;
  }
  public get broker_auth() {
    return this.auth;
  }
  public get auth_state() {
    return this.auth.auth_state;
  }
  public get client_key() {
    if (!this._client_key) throw Error("Client key must be set");
    return this._client_key;
  }
  public set client_key(key: string) {
    this._client_key = key;
  }
  //public tv_exchange(exch: string) {
  //  const key = exch as keyof typeof saxo_exchanges;
  //  if (!saxo_exchanges[key]) logger.error("saxo", key);
  //  return (saxo_exchanges[key] as any)?.id || exch;
  //}
  protected _update = {
    accounts: async () => {
      const { broker_auth, accounts, db, bootstrap, cache } = this;
      await broker_auth
        .fetch_client_key()
        .then((key) => (this.client_key = key))
        .then(() => accounts.update())
        .then(db.insert.accounts)
        .then(() => cache.invalidate.accounts())
        .then(() => bootstrap("SAXO accounts updated"));
    },
    instruments: async () => {
      const { bootstrap, instruments } = this,
        { location_lookup } = instruments,
        { invalidate } = this.cache,
        { insert } = this.db;

      await instruments
        .update()
        .then((i) => ({ i, u: !!Object.keys(i).length }))
        .then((d) => (d.u ? !!insert.instruments(d.i) && d.i : false))
        .then((d) => (d ? invalidate.instruments() && d : false))
        .then((d) => (d ? location_lookup(d) : null))
        .then(() => bootstrap("SAXO instruments updated"));

      // const instrmnts = await this.cache.instruments;
      // const currencies = [
      //   ...new Set(instrmnts.values().map((i) => i.currency)),
      // ];
      //
      // const fx = await this.tv.fx(this.base_currency, currencies);
      // const live_data = await this.tv.live_data(
      //   instrmnts.values().toArray(),
      //   fx,
      //   this.base_currency,
      // );
      // console.log(live_data);
    },
    transactions: async () => {
      const { transctns_update_date, update } = this.transactions,
        { insert } = this.db;

      await transctns_update_date().then(update).then(insert.transactions);
      this.bootstrap("SAXO transactions updated");
    },
    balances: async () => {
      //const { balances } = this.accounts;
      //const { cache, brokers } = this;
      //const balances = await this.accounts.balances(this.cache.accounts);
      //brokers.cache.live_data_balances = await cache.accounts.then(balances);
      //logger.json("SAXO balances", balances);
    },
  };

  public cache: lib.CacheSaxo;
  public api: lib.SaxoApi;
  public auth: lib.AuthSaxo;
  private accounts: lib.AccountsSaxo;
  private instruments: lib.PositionsSaxo;
  private transactions: lib.TransactionsSaxo;
  private live_data: lib.LiveDataSaxo;
  private _client_key?: string;
}
