import { Fetch } from "@backend/brokers/common/index";
import {
  Account,
  Accounts,
  Authorise,
  Position,
  Positions,
  Stocks,
  Cache,
} from "./saxo/index";

const fetch_rate_limit = 250;
function fetch_params(this: Saxo): RequestInit {
  return {
    headers: {
      Authorization: `Bearer ${this.auth_bearer}`,
    },
  };
}

export class Saxo extends Fetch {
  constructor() {
    super(fetch_rate_limit, fetch_params);
    fetch_params.bind(this);
  }

  public await_ready = () =>
    this.authorise.authorised
      ? Promise.resolve()
      : this.ready_resolver || this.define_ready_resolver();

  public fetch_auth_url = () => this.authorise.fetch_code_url();
  public fetch_auth_token = (code: string) => this.authorise.fetch_token(code);

  public chart_data = (
    conid: string,
    period: period_t,
    granularity: period_t,
  ) => this.stocks.chart_data(conid, period, granularity);

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
  private stocks = new Stocks();
  private authorise = new Authorise();
  private ready_resolver?: Promise<void>;
}
