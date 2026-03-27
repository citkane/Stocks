import { Sql } from "./Sql";

export class Database extends Sql {
  public select = {
    ibkr_transactions: (conid: number) => {
      return this.sql.select(
        "ibkr_transactions",
        ["conid", conid],
        ["date", "ASC"],
      ) as Promise<b.i.transaction_t[]>;
    },
    accounts: (broker: broker_t) => {
      return this.sql.select(
        "accounts",
        ["broker", broker],
        ["alias", "ASC"],
      ) as Promise<account_t[]>;
    },
    positions: (broker: broker_t) => {
      return this.sql.select(
        "positions",
        ["broker", broker],
        ["description", "ASC"],
      ) as Promise<position_t[]>;
    },
    chart: (id: string) => this.sql.select_chart(id),
  };

  public insert = {
    ibkr_transactions: (transactions: b.i.transaction_t[]) => {
      return this.sql.insert("ibkr_transactions", transactions);
    },
    accounts: (accounts: account_t[]) => {
      return this.sql.insert("accounts", accounts);
    },
    positions: (positions: position_t[]) => {
      if (!positions.length) throw Error("No positions");

      return this.sql.insert("positions", positions);
    },
    /**
     * Inserts chart data to the database
     * @param id concatenation of broker_id_granulaity
     * @param data time series data
     * @returns Promise of the inserted chart data
     */
    chart: (id: string, data: chart_data_t[]) =>
      this.sql.insert_chart(id, data).then(() => data),
  };
}
