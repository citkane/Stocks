import { Broker } from "@backend/brokers/common";
import {
  AccountsIbkr,
  AuthIbkr,
  PositionsIbkr,
  TransactionsIbkr,
  LiveDataIbkr,
  CacheIbkr,
  ibkr_exchanges,
  EndpointsIbkr,
} from "@backend/brokers/index";

const fetch_rate_limit = 100;
const tls = {
  tls: { rejectUnauthorized: false },
};

export class BrokerIbkr extends Broker {
  constructor() {
    super(fetch_rate_limit, default_fetch_params, tls);
    this.auth_err = this.auth_err.bind(this);
  }

  public override await_auth = () => {
    return this.auth.auth_state
      ? Promise.resolve()
      : this.auth_resolver || this.define_auth_resolver();
  };
  public override logout = async () => {
    await this.auth.logout();
    this.revoke_auth();
  };

  public login = () => this.auth.login();

  public override chart_data = (...p: p.chart_period) => {
    return this.live_data.fetch_chart_data(...p);
  };

  public override revoke_auth = () => {
    this.auth.auth_state = false;
    delete this.auth_resolver;
    this.ws.publish("logged_out", "ibkr");
  };

  public override update = {
    accounts: () => this._update.accounts(),
    positions: () => this._update.positions(),
    transactions: () => this._update.transactions(),
    account_balances: () => this._update.balances(),
    fx: () => this._update.fx(),
  };
  public override get auth_state() {
    return this.auth.auth_state;
  }
  public override get broker_auth() {
    return this.auth;
  }
  public tv_exchange(exch: string, country: string) {
    const postfix = [...exch].pop();
    exch = isNaN(Number(postfix)) ? exch : exch.slice(0, -1);
    const key = `${exch}.${country}` as keyof typeof ibkr_exchanges;
    if (!ibkr_exchanges[key]) logger.error("ibkr", key);

    return (ibkr_exchanges[key] as any)?.id || exch;
  }
  protected override _update = {
    fx: async () => {
      const fx = await this.live_data.update_fx();
      this.brokers.cache.fx = fx;
    },
    accounts: async () => {
      //this.live_data.subscribe();
      const accounts = await this.accounts.update();
      this.cache.accounts = accounts;
      this.bootstrap("IBKR accounts updated");
    },
    positions: async () => {
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

  private define_auth_resolver = () =>
    (this.auth_resolver = this.auth
      .await_auth()
      .then(() => this.bootstrap("IBKR is authorised")));

  public cache = new CacheIbkr();
  public endpoints = new EndpointsIbkr();

  private positions = new PositionsIbkr();
  private transctns = new TransactionsIbkr();
  private live_data = new LiveDataIbkr();
  private accounts = new AccountsIbkr();
  private auth = new AuthIbkr();
}

function default_fetch_params() {
  return {} as RequestInit;
}
