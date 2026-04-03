import { Fetch } from "@backend/brokers/common/index";
import {
  Account,
  Accounts,
  Authorise,
  Positions,
  Transactions,
  Stocks,
  Cache,
} from "./saxo/index";

const fetch_rate_limit = 250;

export class Saxo extends Fetch {
  constructor() {
    super(fetch_rate_limit, default_fetch_params);
    default_fetch_params.bind(this);
  }

  public await_auth = () =>
    this.authorise.authorised
      ? Promise.resolve()
      : this.ready_resolver || this.define_ready_resolver();

  public fetch_auth_url = () => this.authorise.fetch_code_url();
  public fetch_auth_token = (code: string) => this.authorise.fetch_token(code);

  public chart_data = (...p: p.chart_data) =>
    this.stocks.fetch_chart_data(...p);

  public update = {
    accounts: () => this.accounts.update().then(this._update.accounts),
    positions: () => this._update.positions(),
  };

  public get auth_bearer() {
    return this.authorise.token.access_token;
  }
  public get auth() {
    return this.authorise;
  }
  public get is_authorised() {
    return this.authorise.authorised;
  }
  public cache = new Cache();

  private _update = {
    accounts: (accounts: b.s.account_t[]) => {
      const _accounts = accounts.map((a) => new Account(a).translate());
      this.cache.accounts = Promise.resolve(_accounts);
      console.info("SAXO accounts updated");
    },
    positions: async () => {
      //await this.positions.info(207913);
      const positions = await this.positions.update();
      this.cache.market_view = this.positions.market_view(positions);

      const { is_init, date } = await this.transactions.update_schedule();
      const transactions = this.transactions.update(date);

      this.brokers.cache.transactions_part = transactions;
      return transactions
        .then(() =>
          is_init
            ? this.db.insert.transactions_updated("saxo", util.time.ms_now())
            : this.db.update.transactions_updated("saxo", util.time.ms_now()),
        )
        .then(() => console.info("SAXO positions updated"))
        .catch((err) => console.error(err));
    },
  };
  private define_ready_resolver = () =>
    (this.ready_resolver = this.authorise
      .await_auth()
      .then(() => console.info("Saxo is ready")));

  private accounts = new Accounts();
  private positions = new Positions();
  private transactions = new Transactions();

  private stocks = new Stocks();
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
