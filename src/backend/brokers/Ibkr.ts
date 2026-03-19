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
function fetch_default_params() {
  return {
    tls: { rejectUnauthorized: false },
  } as RequestInit;
}

export class Ibkr extends Fetch {
  constructor() {
    super(fetch_rate_limit, fetch_default_params);
  }
  public await_ready = () =>
    this.authorise.authorised
      ? Promise.resolve()
      : this.ready_resolver || this.define_ready_resolver();

  public chart_data = (...p: p.chart_data) => this.stocks.chart_data(...p);

  public get is_authorised() {
    return this.authorise.authorised;
  }
  public get auth() {
    return this.authorise;
  }

  public cache = new Cache();

  private define_ready_resolver = () =>
    (this.ready_resolver = this.authorise
      .await_auth()
      .then(this.fetch_fx_pairs)
      .then(() => console.info("IBKR is ready")));

  private update = () => this.update_accounts().then(this.update_positions);
  private update_accounts = () =>
    this.accounts
      .update()
      .then((accs) => accs.map((a) => new Account(a).map()))
      .then((accs) => (this.cache.accounts = accs))
      .then(() => console.info("IBKR accounts updated"));
  private update_positions = () =>
    this.positions
      .update()
      .then((pos) => (this.cache.positions = pos))
      .then(() => console.info("IBKR positions updated"));

  private fetch_fx_pairs = () => {
    const { currencies } = this.brokers;
    return Promise.all(currencies.map(this.stocks.fx_rate))
      .then(this.map_fx_pairs)
      .then((fx_rates) => {
        this.cache.fx_rates = fx_rates;
      });
  };

  private map_fx_pairs = (pairs: fx_pair_t[]) => {
    const { base_currency } = this.brokers;
    const collector: fx_rates_t = { [base_currency]: 1 } as any;
    return pairs.reduce((c, val) => {
      return { ...c, ...val };
    }, collector);
  };

  private positions = new Positions();
  private stocks = new Stocks();
  private accounts = new Accounts();
  private authorise = new Authorise();

  private ready_resolver?: Promise<void>;
}
