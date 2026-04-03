import { Fetch } from "@backend/brokers/common/index";
import {
  Accounts,
  Authorise,
  Positions,
  Transactions,
  Stocks,
  Cache,
  Account,
} from "./ibkr/index";

const fetch_rate_limit = 100;
const tls = {
  tls: { rejectUnauthorized: false },
};

export class Ibkr extends Fetch {
  constructor() {
    super(fetch_rate_limit, default_fetch_params, tls);
  }
  public await_auth = () =>
    this.authorise.authorised
      ? Promise.resolve()
      : this.ready_resolver || this.define_ready_resolver();

  public chart_data = (...p: p.chart_data) =>
    this.stocks.fetch_chart_data(...p);

  public update = {
    fx: () => this.stocks.update_fx().then(this._update.fx),
    accounts: () => this.accounts.update().then(this._update.accounts),
    positions: () => this._update.transactions(),
  };

  public get is_authorised() {
    return this.authorise.authorised;
  }
  public get auth() {
    return this.authorise;
  }

  public cache = new Cache();
  public fx_rates?: fx_rates_t;

  private _update = {
    fx: (rates: fx_rates_t) => {
      this.fx_rates = rates;
    },
    accounts: (accounts: b.i.account_t[]) => {
      const _accounts = accounts.map((a) => new Account(a).translate());
      this.cache.accounts = Promise.resolve(_accounts);
      console.info("IBKR accounts updated");
    },
    transactions: async () => {
      const accounts = await this.cache.accounts;
      const acc_ids = accounts.map((a) => a.a_id_original);
      const positions = await this.positions.update(acc_ids);

      const con_ids = positions.map((p) => p.conid);

      const market_view = this.positions.market_view(con_ids);
      this.cache.market_view = market_view;
      await market_view;

      const { is_init, days } = await this.transactions.update_schedule();
      const transactions = this.transactions.update(acc_ids, con_ids, days);

      this.brokers.cache.transactions_part = transactions;
      return transactions
        .then(() =>
          is_init
            ? this.db.insert.transactions_updated("ibkr", util.time.ms_now())
            : this.db.update.transactions_updated("ibkr", util.time.ms_now()),
        )
        .then(() => console.info("IBKR positions updated"))
        .catch((err) => console.error(err));
    },
  };
  private define_ready_resolver = () =>
    (this.ready_resolver = this.authorise
      .await_auth()
      .then(() => console.info("IBKR is ready")));

  private positions = new Positions();
  private transactions = new Transactions();
  private stocks = new Stocks();
  private accounts = new Accounts();
  private authorise = new Authorise(fetch_rate_limit);

  private ready_resolver?: Promise<void>;
}

function default_fetch_params() {
  return {} as RequestInit;
}
