import { Account } from "./Account";
import { IbkrPositions, SaxoPosition } from "./Position";
import { Global } from "backend";

type _account_t = ibkr_t.account_t | saxo_t.account_t;
type _position_t = ibkr_t.position_t | saxo_t.position_t;

export class Broker extends Global {
  protected cache_add_positions = (
    broker: broker_t,
    positions: _position_t[],
  ) => {
    positions.forEach((p) => {
      if (broker === "saxo") {
        const position = new SaxoPosition(p as saxo_t.position_t).map();
        this.cache.add.position(position);
      } else {
        const transactions = this.db.select.ibkr_transactions(
          (p as ibkr_t.position_t).conid,
        );
        console.log(transactions);
        //app.cache.store.ibkr_transactions(
        //  (p as ibkr_t.position_t).transactions,
        //);
        new IbkrPositions(p as ibkr_t.position_t).positions.forEach(
          (position) => this.cache.add.position(position.map()),
        );
      }
    });

    logger.json(`${broker.toUpperCase()} positions`, positions);
    logger.json(
      `${broker.toUpperCase()} positions cache`,
      this.cache[`${broker}_positions`],
    );
  };

  protected cache_add_accounts = (broker: broker_t, accounts: _account_t[]) => {
    accounts.forEach((a) => {
      const account = new Account(a, broker).map();
      this.cache.add.account(account);
    });

    logger.json(`${broker.toUpperCase()} accounts`, accounts);
    logger.json(
      `${broker.toUpperCase()} accounts cache`,
      this.cache[`${broker}_accounts`],
    );
  };

  protected cache_add_fx = (fx_pairs: fx_pairs_t[]) => {
    this.cache.fx_pairs = fx_pairs.reduce(
      (c, val) => {
        return { ...c, ...val };
      },
      { [this.brokers.base_currency]: 1 },
    );

    logger.json("FX pairs", this.cache.fx_pairs);
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
}
