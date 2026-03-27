import { Fetch } from "@backend/brokers/common/index";
import {
  Account,
  Accounts,
  Authorise,
  Position,
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

  public await_ready = () =>
    this.authorise.authorised
      ? Promise.resolve()
      : this.ready_resolver || this.define_ready_resolver();

  public fetch_auth_url = () => this.authorise.fetch_code_url();
  public fetch_auth_token = (code: string) => this.authorise.fetch_token(code);

  public chart_data = (...p: p.chart_data) =>
    this.stocks.fetch_chart_data(...p);

  public update = {
    accounts: () => this.accounts.update().then(this._update.accounts),
    positions: () => this.positions.update().then(this._update.positions),
    transactions: () =>
      this.transactions.update().then(this.transactions.transform),
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
      logger.json("SAXO accounts", accounts);
      const _accounts = accounts.map((a) => new Account(a).translate());
      this.cache.accounts = Promise.resolve(_accounts);
      console.info("SAXO accounts updated");
    },
    positions: async (positions: b.s.position_t[]) => {
      const _positions = await this.update.transactions();

      logger.json("SAXO positions", positions);
      const positions_cache = positions.map((p) => {
        const position = new Position(p).translate();
        const _position = _positions.find((_p) => _p.p_id === position.p_id);
        if (!_position) {
          console.log(position);
          return position;
        }
        _position.fx_market = position.fx_market;
        _position.price_market = position.price_market;
        //let { p_id } = position;
        //p_id = p_id.split("_")[1]!;
        //const fx_buy = partial_positions[p_id];
        //console.log(fx_buy || position);
        //
        //position.fx_buy = fx_buy?.fx_buy || position.fx_buy;
        return _position;
      });
      this.cache.positions = Promise.resolve(positions_cache);
      logger.json("SAXO positions cached", positions_cache);

      console.info("SAXO positions updated");
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
