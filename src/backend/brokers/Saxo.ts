import {
  Account,
  Accounts,
  Authorise,
  Fetch,
  Oauth,
  Position,
  Positions,
  Stocks,
  Cache,
} from "./saxo/index";

export class Saxo extends Fetch {
  public await_ready = () =>
    this.authorise.authorised
      ? Promise.resolve()
      : this.ready_resolver ||
        this.define_ready_resolver().then(() => {
          this.ibkr.await_ready().then(this.update);
        });

  public is_authorised = () => this.authorise.is_authorised();
  public fetch_auth_url = () => this.authorise.fetch_code_url();
  public set_auth_token = (code: string) => this.oauth.set_token(code);
  public read_auth_token = () => this.oauth.read_token();
  public refresh_token = (token: string) => this.oauth.refresh_token(token);

  public chart_data = (
    conid: string,
    period: period_t,
    granularity: period_t,
  ) => this.stocks.chart_data(conid, period, granularity);

  public get auth_token() {
    return this.oauth.token;
  }
  public get auth() {
    return this.authorise;
  }
  public cache = new Cache();

  private define_ready_resolver = () =>
    (this.ready_resolver = this.authorise
      .await_auth()
      .then(() => console.info("Saxo is ready")));

  private update = () => {
    this.update_accounts();
    this.update_positions();
  };
  private update_accounts = () =>
    this.accounts
      .update()
      .then((accs) => accs.map((a) => new Account(a).translate()))
      .then((accs) => (this.cache.accounts = accs));
  private update_positions = () =>
    this.positions
      .update()
      .then((pos) => pos.map((p) => new Position(p).translate()))
      .then((pos) => (this.cache.positions = pos));

  private accounts = new Accounts();
  private positions = new Positions();
  private oauth = new Oauth();
  private stocks = new Stocks();
  private authorise = new Authorise();
  private ready_resolver?: Promise<void>;
}
