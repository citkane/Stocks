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

export class Saxo extends Fetch {
  constructor() {
    super(fetch_rate_limit, fetch_params_factory);
    fetch_params_factory.bind(this);
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

  //public update = {
  //  accounts: () =>
  //    (this.cache.accounts = this.accounts
  //      .update()
  //      .then((accs) => accs.map((a) => new Account(a).translate()))),
  //
  //  positions: () =>
  //    (this.cache.positions = this.positions
  //      .update()
  //      .then((pos) =>
  //        Promise.all(pos.map((p) => new Position(p).translate())),
  //      )),
  //};
  public update = {
    accounts: () =>
      (this.cache.accounts = this.accounts.update().then((accs) => {
        logger.json("SAXO accounts", accs);
        return accs.map((a) => new Account(a).translate());
      })),

    positions: () =>
      (this.cache.positions = this.positions.update().then((pos) => {
        logger.json("SAXO positions", pos);
        return Promise.all(pos.map((p) => new Position(p).translate()));
      })),
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

  private define_ready_resolver = () =>
    (this.ready_resolver = this.authorise
      .await_auth()
      .then(() => console.info("Saxo is ready")));

  private accounts = new Accounts();
  private positions = new Positions();
  private stocks = new Stocks();
  private authorise = new Authorise(fetch_rate_limit);
  private ready_resolver?: Promise<void>;
}

function fetch_params_factory(this: Saxo): RequestInit {
  return {
    headers: {
      Authorization: `Bearer ${this.auth_bearer}`,
    },
  };
}
