import { Broker } from "@backend/brokers/common";
import {
  AccountsSaxo,
  AuthSaxo,
  PositionsSaxo,
  TransactionsSaxo,
  LiveDataSaxo,
  CacheSaxo,
  saxo_exchanges,
  EndpointsSaxo,
} from "@backend/brokers/index";

const fetch_rate_limit = 250;

export class BrokerSaxo extends Broker {
  constructor() {
    super(fetch_rate_limit, default_fetch_params);
    default_fetch_params.bind(this);
    this.what_err = this.what_err.bind(this);
  }
  public override await_auth = async () => {
    return this.auth.auth_state
      ? Promise.resolve()
      : this.auth_resolver || this.define_auth_resolver();
  };
  public override logout = async () => {
    await this.auth.logout();
    this.revoke_auth();
  };
  public override revoke_auth = () => {
    this.auth.auth_state = false;
    delete this.auth_resolver;
    this.ws.publish("logged_out", "saxo");
  };
  public override chart_data = (...p: p.chart_period) => {
    return this.live_data.fetch_chart_data(...p);
  };

  public override update = {
    accounts: () => this._update.accounts(),
    positions: () => this._update.positions(),
    transactions: () => this._update.transactions(),
    account_balances: () => this._update.balances(),
  };

  public fetch_auth_url = () => this.auth.fetch_code_url();
  public fetch_token = (code: string) => this.auth.fetch_token(code);

  public get auth_bearer() {
    return this.auth.auth_token.access_token;
  }
  public override get broker_auth() {
    return this.auth;
  }
  public override get auth_state() {
    return this.auth.auth_state;
  }
  public get client_key() {
    if (!this._client_key) throw Error("Client key must be set");
    return this._client_key;
  }
  public set client_key(key: string) {
    this._client_key = key;
  }
  public tv_exchange(exch: string) {
    const key = exch as keyof typeof saxo_exchanges;
    if (!saxo_exchanges[key]) logger.error("saxo", key);
    return (saxo_exchanges[key] as any)?.id || exch;
  }
  protected override _update = {
    accounts: async () => {
      const key = await this.broker_auth.fetch_client_key();
      this.client_key = key;
      const accounts = await this.accounts.update();
      this.cache.accounts = accounts;
      logger.json("SAXO accounts", accounts);
      this.bootstrap("SAXO accounts updated");
    },
    positions: async () => {
      let postns = await this.positions.update();
      this.cache.positions = postns;
      this.bootstrap("SAXO got positions");
      logger.json("SAXO positions", postns);
    },
    transactions: async () => {
      const date = await this.transactions.transctns_update_date();
      const transactions = await this.transactions.update(date);
      await this.brokers.cache.set_transctns(transactions);
      this.bootstrap("SAXO transactions updated");
    },
    balances: async () => {
      const balances = await this.accounts.balances(this.cache.accounts);
      this.brokers.cache.live_data_balances = balances;
      logger.json("SAXO balances", balances);
    },
  };

  private define_auth_resolver = () =>
    (this.auth_resolver = this.auth
      .await_auth()
      .then(() => this.bootstrap("Saxo is authorised")));

  public cache = new CacheSaxo();
  public endpoints = new EndpointsSaxo();

  private accounts = new AccountsSaxo();
  private positions = new PositionsSaxo();
  private transactions = new TransactionsSaxo();
  private live_data = new LiveDataSaxo();
  private auth = new AuthSaxo();
  private _client_key?: string;
}

function default_fetch_params(this: BrokerSaxo): RequestInit {
  return {
    headers: {
      Authorization: `Bearer ${this.auth_bearer}`,
    },
  };
}
