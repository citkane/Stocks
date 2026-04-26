import { Broker } from "@backend/brokers/common/index";
import {
  Account,
  Accounts,
  Authorise,
  Positions,
  Transactions,
  LiveData,
  Cache,
  Exchanges,
  Ref,
} from "./saxo/index";

const fetch_rate_limit = 250;

export class Saxo extends Broker {
  constructor() {
    super(fetch_rate_limit, default_fetch_params);
    default_fetch_params.bind(this);
  }

  public override await_auth = () =>
    this.authorise.authorised
      ? Promise.resolve()
      : this.ready_resolver || this.define_ready_resolver();

  public override chart_data = (...p: p.chart_period) =>
    this.live_data.fetch_chart_data(...p);

  public override update = {
    accounts: () => this._update.accounts(),
    positions: () => this._update.positions(),
    transactions: () => this._update.transactions(),
  };

  public fetch_auth_url = () => this.authorise.fetch_code_url();
  public fetch_auth_token = (code: string) => this.authorise.fetch_token(code);
  public fetch_exchanges = () => this.ref.exchanges();

  public get auth_bearer() {
    return this.authorise.token.access_token;
  }
  public override get auth() {
    return this.authorise;
  }
  public override get is_authorised() {
    return this.authorise.authorised;
  }

  protected override _update = {
    accounts: async () => {
      const _accounts = await this.accounts.update();
      const accounts = _accounts.map((a) => new Account(a).translate());
      await this.brokers.cache.set_accounts(Promise.resolve(accounts));
      logger.info("SAXO accounts updated");
    },
    positions: async () => {
      let postns = await this.positions.update();
      this.cache.positions = postns;
      logger.info("SAXO got positions");
      logger.json("SAXO positions", postns);
    },
    transactions: async () => {
      const { is_init, date } = await this.transactions.transctns_update_date();
      const transactions = this.transactions.update(date);
      await this.brokers.cache.set_transctns(transactions);
      const fn = is_init ? this.db.insert : this.db.update;
      await fn.transctns_update_date("saxo", util.time.ms_now());
      logger.info("SAXO transactions updated");
    },
  };

  // SAXO fucks up ZAR price rounding
  public fix_zar = (transaction: transctn_t) => {
    const { broker, currency, price_market, price_traded } = transaction;
    if (!(broker === "saxo" && currency === "ZAR")) return transaction;
    transaction.price_market = price_market ? price_market / 100 : undefined;
    transaction.price_traded = price_traded ? price_traded / 100 : undefined;
    return transaction;
  };
  private define_ready_resolver = () =>
    (this.ready_resolver = this.authorise
      .await_auth()
      .then(() => logger.info("Saxo is ready")));

  public cache = new Cache();
  public exchgs = new Exchanges();
  private accounts = new Accounts();
  private positions = new Positions();
  private transactions = new Transactions();
  private live_data = new LiveData();
  private ref = new Ref();
  private authorise = new Authorise(fetch_rate_limit);
  private ready_resolver?: Promise<void>;
}

function default_fetch_params(this: Saxo): RequestInit {
  return {
    headers: {
      Authorization: `Bearer ${this.auth_bearer}`,
    },
  };
}
