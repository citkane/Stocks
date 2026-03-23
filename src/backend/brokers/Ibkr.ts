import { Fetch } from "@backend/brokers/common/index";
import {
  Accounts,
  Authorise,
  Positions,
  Stocks,
  Cache,
  Account,
} from "./ibkr/index";

const fetch_rate_limit = 100;

export class Ibkr extends Fetch {
  constructor() {
    super(fetch_rate_limit, default_fetch_params);
  }
  public await_ready = () =>
    this.authorise.authorised
      ? Promise.resolve()
      : this.ready_resolver || this.define_ready_resolver();

  public chart_data = (...p: p.chart_data) =>
    this.stocks.fetch_chart_data(...p);

  public update = {
    fx: () => this.stocks.update_fx().then((rates) => (this.fx_rates = rates)),
    accounts: () =>
      (this.cache.accounts = this.accounts
        .update()
        .then((accs) => accs.map((a) => new Account(a).translate()))),

    positions: () => (this.cache.positions = this.positions.update()),
  };

  public get is_authorised() {
    return this.authorise.authorised;
  }
  public get auth() {
    return this.authorise;
  }

  public cache = new Cache();
  public fx_rates?: fx_rates_t;

  private define_ready_resolver = () =>
    (this.ready_resolver = this.authorise
      .await_auth()
      .then(() => console.info("IBKR is ready")));

  private positions = new Positions();
  private stocks = new Stocks();
  private accounts = new Accounts();
  private authorise = new Authorise(fetch_rate_limit);

  private ready_resolver?: Promise<void>;
}

function default_fetch_params() {
  return {
    tls: { rejectUnauthorized: false },
  } as RequestInit;
}
