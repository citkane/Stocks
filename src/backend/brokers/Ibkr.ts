import { Broker } from "@backend/brokers/common/index";
import {
  Accounts,
  Authorise,
  Positions,
  Transactions,
  LiveData,
  Cache,
  Account,
  Exchanges,
} from "@backend/brokers/ibkr/index";

const fetch_rate_limit = 100;
const tls = {
  tls: { rejectUnauthorized: false },
};

export class Ibkr extends Broker {
  constructor() {
    super(fetch_rate_limit, default_fetch_params, tls);
  }

  public override await_auth = () => {
    return this.authorise.authorised
      ? Promise.resolve()
      : this.ready_resolver || this.define_ready_resolver();
  };
  public override chart_data = (...p: p.chart_period) => {
    return this.live_data.fetch_chart_data(...p);
  };
  public fx = () => this.live_data.update_fx();

  public override update = {
    accounts: () => this._update.accounts(),
    positions: () => this._update.positions(),
    transactions: () => this._update.transactions(),
  };
  public override get is_authorised() {
    return this.authorise.authorised;
  }
  public override get auth() {
    return this.authorise;
  }

  protected override _update = {
    accounts: async () => {
      //this.live_data.subscribe();
      const _accounts = await this.accounts.update();
      const accounts = _accounts.map((a) => new Account(a).translate());
      await this.brokers.cache.set_accounts(Promise.resolve(accounts));
      logger.info("IBKR accounts updated");
    },
    positions: async () => {
      const acc_ids = await this.cache.a_ids;
      const positions = await this.positions.update(acc_ids);
      this.cache.positions = positions;

      logger.info("IBKR got positions");
      logger.json("IBKR positions", positions);
    },
    transactions: async () => {
      const a_ids = await this.cache.a_ids;
      const con_ids = this.cache.conids;

      const { is_init, days } = await this.transctns.transctns_update_date();
      const transactions = this.transctns.update(a_ids, con_ids, days);
      await this.brokers.cache.set_transctns(transactions);
      const fn = is_init ? this.db.insert : this.db.update;
      await fn.transctns_update_date("ibkr", util.time.ms_now());
      logger.info("IBKR transactions updated");
    },
  };

  private define_ready_resolver = () =>
    (this.ready_resolver = this.authorise
      .await_auth()
      .then(() => logger.info("IBKR is ready")));

  public cache = new Cache();
  public exchgs = new Exchanges();
  private positions = new Positions();
  private transctns = new Transactions();
  private live_data = new LiveData();
  private accounts = new Accounts();
  private authorise = new Authorise(fetch_rate_limit);

  private ready_resolver?: Promise<void>;
}

function default_fetch_params() {
  return {} as RequestInit;
}
