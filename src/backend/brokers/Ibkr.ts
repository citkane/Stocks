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
const tls = {
  tls: { rejectUnauthorized: false },
};

export class Ibkr extends Fetch {
  constructor() {
    super(fetch_rate_limit, default_fetch_params, tls);
  }
  public await_ready = () =>
    this.authorise.authorised
      ? Promise.resolve()
      : this.ready_resolver || this.define_ready_resolver();

  public chart_data = (...p: p.chart_data) =>
    this.stocks.fetch_chart_data(...p);

  public update = {
    fx: () => this.stocks.update_fx().then(this._update.fx),
    accounts: () => this.accounts.update().then(this._update.accounts),
    positions: () =>
      this.positions
        .update()
        .then(this._update.positions)
        .catch((err) => this._update.error(err, this.update.positions)),
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
      logger.json("FX rates", rates);
      this.fx_rates = rates;
    },
    accounts: (accounts: b.i.account_t[]) => {
      logger.json("IBKR accounts", accounts);
      const _accounts = accounts.map((a) => new Account(a).translate());
      this.cache.accounts = Promise.resolve(_accounts);
      console.info("IBKR accounts updated");
    },
    positions: (data: b.i.positions_data_t) => {
      const { transactions, positions: _positions } = data;
      const positions = _positions.frontend;
      const broker_positions = _positions.broker;

      logger.json("IBKR transactions", transactions);
      logger.json("IBKR positions cached", positions);
      logger.json("IBKR positions", broker_positions);

      this.cache.positions = Promise.resolve(positions);
      this.cache.transactions = Promise.resolve(transactions);
      console.info("IBKR positions updated");
    },
    error: (err: any, fnc: Function, retry = 0) => {
      err = err["Fetch error: "];
      if (err && err.status === 500 && retry <= 3) {
        err.retry = retry;
        console.warn(err);
        return new Promise((resolve) => {
          retry++;
          setTimeout(() => {
            fnc()
              .then(resolve)
              .catch((err: any) => this._update.error(err, fnc, retry));
          }, 1000);
        });
      } else {
        throw err;
      }
    },
  };
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
  return {} as RequestInit;
}
