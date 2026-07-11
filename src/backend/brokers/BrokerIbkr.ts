import { Global } from "@backend/Global";
import * as lib from "@backend/brokers/ibkr/index";

export class BrokerIbkr extends Global {
  constructor() {
    super();
    this.api = new lib.IbkrApi();
    this.instruments = new lib.InstrumentsIbkr();
    this.transctns = new lib.TransactionsIbkr();
    this.live_data = new lib.LiveDataIbkr();
    this.accounts = new lib.AccountsIbkr();
    this.auth = new lib.AuthIbkr();
  }

  public await_auth = () => this.auth.await_auth();

  public login = () => this.auth.login();
  public logout = () => this.auth.logout();

  public chart_data = (...p: pr.chart_period) => {
    return this.live_data.fetch_chart_data(...p);
  };
  public acc_balances = async () => {
    // if (!this.auth_state) return {};
    // return {} as { [a_id: string]: g.balance };
    //const accounts = await this.cache.accounts;
    //return this.accounts.balances(accounts);
  };

  //public update = {
  update_accounts = () => this.update.accounts();
  update_instruments = () => this.update.instruments();
  update_transactions = () => this.update.transactions();
  //account_balances: () => this._update.balances(),
  //fx: () => this._update.fx(),
  //};
  public get auth_state() {
    return this.auth.state;
  }
  //public tv_exchange(exch: string, country: string) {
  //  const postfix = [...exch].pop();
  //  exch = isNaN(Number(postfix)) ? exch : exch.slice(0, -1);
  //  const key = `${exch}.${country}` as keyof typeof ibkr_exchanges;
  //  if (!ibkr_exchanges[key]) logger.error("ibkr", key);
  //
  //  return (ibkr_exchanges[key] as any)?.id || exch;
  //}
  protected update = {
    //fx: async () => {
    //  const fx = await this.live_data.update_fx();
    //  this.brokers.cache.fx = fx;
    //},
    accounts: () => {
      const { accounts, db, bootstrap } = this;
      return accounts
        .update()
        .then(db.insert.accounts.data)
        .then(() => bootstrap("IBKR accounts updated"));
    },
    instruments: async () => {
      const { bootstrap, instruments } = this;
      const instrmnts = await instruments.update();
      bootstrap("IBKR instruments updated");
      return instrmnts;
    },
    transactions: async () => {
      const { db, bootstrap, transctns } = this;

      return transctns
        .last_update_date()
        .then(transctns.update)
        .then(db.insert.transctns.data)
        .then(() => bootstrap("IBKR transactions updated"));
      //const a_ids = await this.cache.a_ids;
      //const con_ids = this.cache.conids;
      //
      //const days_ago = await this.transctns.transctns_update_date();
      //const transactions = await this.transctns.update(
      //  a_ids,
      //  con_ids,
      //  days_ago,
      //);
      //await this.brokers.cache.set_transctns(transactions);
      //this.bootstrap("IBKR transactions updated");
    },
    balances: async () => {
      //const balances = await this.accounts.balances(this.cache.accounts);
      //this.brokers.cache.live_data_balances = balances;
      //logger.json("IBKR balances", balances);
    },
  };

  public auth: lib.AuthIbkr;
  public api: lib.IbkrApi;
  private instruments: lib.InstrumentsIbkr;
  private transctns: lib.TransactionsIbkr;
  private live_data: lib.LiveDataIbkr;
  private accounts: lib.AccountsIbkr;
}
