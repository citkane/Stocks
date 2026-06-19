import { Global } from "@backend/Global";
import * as lib from "@backend/brokers/ibkr/index";

export class BrokerIbkr extends Global {
  constructor() {
    super();
    this.cache = new lib.CacheIbkr();
    this.api = new lib.IbkrApi();
    this.positions = new lib.PositionsIbkr();
    this.transctns = new lib.TransactionsIbkr();
    this.live_data = new lib.LiveDataIbkr();
    this.accounts = new lib.AccountsIbkr();
    this.auth = new lib.AuthIbkr();
  }

  public await_auth = () => this.auth.await_auth();

  public login = () => this.auth.login();
  public logout = () => this.auth.logout();

  public chart_data = (...p: p.chart_period) => {
    return this.live_data.fetch_chart_data(...p);
  };
  public acc_balances = async () => {
    if (!this.auth_state) return {};
    return {} as { [a_id: string]: balance_t };
    //const accounts = await this.cache.accounts;
    //return this.accounts.balances(accounts);
  };

  public update = {
    accounts: () => this._update.accounts(),
    instruments: () => this._update.positions(),
    transactions: () => this._update.transactions(),
    //account_balances: () => this._update.balances(),
    //fx: () => this._update.fx(),
  };
  public get auth_state() {
    return this.auth.auth_state;
  }
  //public tv_exchange(exch: string, country: string) {
  //  const postfix = [...exch].pop();
  //  exch = isNaN(Number(postfix)) ? exch : exch.slice(0, -1);
  //  const key = `${exch}.${country}` as keyof typeof ibkr_exchanges;
  //  if (!ibkr_exchanges[key]) logger.error("ibkr", key);
  //
  //  return (ibkr_exchanges[key] as any)?.id || exch;
  //}
  protected _update = {
    //fx: async () => {
    //  const fx = await this.live_data.update_fx();
    //  this.brokers.cache.fx = fx;
    //},
    accounts: async () => {
      //this.live_data.subscribe();
      const accounts = await this.accounts.update();
      this.cache.accounts = accounts;
      this.bootstrap("IBKR accounts updated");
    },
    positions: async () => {
      const ex_instrmnts = await this.db.select.instruments("ibkr");
      this.cache.set_instruments(ex_instrmnts);
      //console.log(
      //  "ex_instrmnts:",
      //  ex_instrmnts.length,
      //  this.cache.instruments.keys(),
      //);

      const acc_ids = await this.cache.a_ids;
      const positions = await this.positions.update(acc_ids);
      this.cache.positions = positions;

      this.bootstrap("IBKR got positions");
      logger.json("IBKR positions", positions);
    },
    transactions: async () => {
      const a_ids = await this.cache.a_ids;
      const con_ids = this.cache.conids;

      const days_ago = await this.transctns.transctns_update_date();
      const transactions = await this.transctns.update(
        a_ids,
        con_ids,
        days_ago,
      );
      await this.brokers.cache.set_transctns(transactions);
      this.bootstrap("IBKR transactions updated");
    },
    balances: async () => {
      const balances = await this.accounts.balances(this.cache.accounts);
      this.brokers.cache.live_data_balances = balances;
      logger.json("IBKR balances", balances);
    },
  };

  public cache: lib.CacheIbkr;
  public auth: lib.AuthIbkr;
  public api: lib.IbkrApi;
  private positions: lib.PositionsIbkr;
  private transctns: lib.TransactionsIbkr;
  private live_data: lib.LiveDataIbkr;
  private accounts: lib.AccountsIbkr;
}
