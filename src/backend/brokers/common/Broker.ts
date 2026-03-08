import { Position, Account, App, Cache, ServerWs, Brokers } from "backend";
import type { ibkr_t, saxo_t } from "types";

type _account_t = ibkr_t.account_t | saxo_t.account_t;
type _position_t = ibkr_t.position_t | saxo_t.position_t;

export class Broker {
  constructor(protected app: App) {
    this.cache = app.cache;
    this.ws = app.ws;
  }

  protected cache_add_positions = (
    broker: broker_t,
    positions: _position_t[],
  ) => {
    positions.forEach((p) => {
      const position = new Position(p, broker).map();
      this.cache.add.position(position);
    });

    console.json(`${broker.toUpperCase()} positions`, positions);
    console.json(
      `${broker.toUpperCase()} positions cache`,
      this.cache[`${broker}_positions`],
    );
  };

  protected cache_add_accounts = (broker: broker_t, accounts: _account_t[]) => {
    accounts.forEach((a) => {
      const account = new Account(a, broker).map();
      this.cache.add.account(account);
    });

    console.json(`${broker.toUpperCase()} accounts`, accounts);
    console.json(
      `${broker.toUpperCase()} accounts cache`,
      this.cache[`${broker}_accounts`],
    );
  };

  protected cache_add_fx = (fx_pairs: fx_pairs_t[]) => {
    Cache.fx_pairs = fx_pairs.reduce(
      (c, val) => {
        return { ...c, ...val };
      },
      { [Brokers.base_currency]: 1 },
    );

    console.json("FX pairs", Cache.fx_pairs);
  };

  protected response(res: Response): Promise<any> {
    if (!res.ok) {
      const { url, status, statusText } = res;
      const err_message = `Error in fetch response:\n${JSON.stringify({ url, status, statusText }, null, 4)}`;
      return Promise.reject(err_message);
    }
    const type = res.headers.get("content-type");
    if (type?.includes("application/json")) return res.json();
    return Promise.resolve(res);
  }

  public cache: Cache;
  protected ws: ServerWs;
}
