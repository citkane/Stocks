import {
  Accounts,
  Authorise,
  Fetch,
  Positions,
  Stocks,
  Cache,
  Account,
} from "./ibkr/index";

const fx_endpoint = "iserver/exchangerate";

export class Ibkr extends Fetch {
  public await_ready = () =>
    this.authorise.authorised
      ? Promise.resolve()
      : this.ready_resolver ||
        this.define_ready_resolver().then(() => {
          this.update();
        });

  public is_authorised = () => this.authorise.is_authorised();
  public chart_data = (
    conid: string,
    period: period_t,
    granularity: period_t,
  ) => this.stocks.chart_data(conid, period, granularity);
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
    return Promise.all(currencies.map(this.fetch_fx))
      .then(this.map_fx_pairs)
      .then((fx_rates) => (this.cache.fx_rates = fx_rates));
  };
  private fetch_fx = (source: currency_t) => {
    const { base_currency } = this.brokers;
    return this.ibkr.fetch<ibkr_t.fx_rate_t>(
      `${fx_endpoint}?Source=${source}&Target=${base_currency}`,
    );
  };
  private map_fx_pairs = (pairs: ibkr_t.fx_rate_t[]) => {
    const { base_currency } = this.brokers;
    const collector = { [base_currency]: 1 } as unknown as fx_rates_t;
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
