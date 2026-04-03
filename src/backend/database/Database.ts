import { Sql } from "./Sql";

export class Database extends Sql {
  public select = {
    //ibkr_transactions: (conid: number) => {
    //  return this.sql.select(
    //    "ibkr_transactions",
    //    ["conid", conid],
    //    ["date", "ASC"],
    //  ) as Promise<b.i.transaction_t[]>;
    //},
    accounts: (broker: broker_t) => {
      return this.sql.select(
        "accounts",
        ["broker", broker],
        ["alias", "ASC"],
      ) as Promise<account_t[]>;
    },
    //positions: (broker: broker_t) => {
    //  return this.sql.select(
    //    "positions",
    //    ["broker", broker],
    //    ["description", "ASC"],
    //  ) as Promise<transaction_t[]>;
    //},
    transactions: (broker?: broker_t) => {
      return this.sql.select(
        "transactions",
        broker ? ["broker", broker] : undefined,
        ["date", "DESC"],
      );
    },
    transactions_updated: (broker: broker_t) => {
      return this.sql
        .select("transactions_updated", ["broker", broker])
        .then((data) => {
          return data[0] ? data[0].time : undefined;
        }) as Promise<number | undefined>;
    },
    chart: (id: string) => this.sql.select_chart(id),
  };

  public insert = {
    //ibkr_transactions: (transactions: b.i.transaction_t[]) => {
    //  return this.sql.insert("ibkr_transactions", transactions);
    //},
    transactions_updated: (broker: broker_t, time: number) => {
      return this.sql.insert("transactions_updated", [{ broker, time }]);
    },
    transactions: (transactions: transaction_t[]) => {
      if (!transactions.length) return Promise.resolve();
      return this.sql.insert("transactions", transactions);
    },
    accounts: (accounts: account_t[]) => {
      return this.sql.insert("accounts", accounts);
    },
    //positions: (positions: transaction_t[]) => {
    //  if (!positions.length) throw Error("No positions");
    //
    //  return this.sql.insert("positions", positions);
    //},
    /**
     * Inserts chart data to the database
     * @param id concatenation of broker_id_granulaity
     * @param data time series data
     * @returns Promise of the inserted chart data
     */
    chart: (id: string, data: chart_data_t[]) => {
      return this.sql.insert_chart(id, data);
    },
  };

  public update = {
    transactions_updated: (broker: broker_t, time: number) => {
      return this.sql.update("transactions_updated", { broker, time }, [
        "broker",
        broker,
      ]);
    },
  };
}
