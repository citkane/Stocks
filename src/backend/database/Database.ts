import { Database as Db } from "bun:sqlite";
import { sql } from "./sql";

export class Database {
  constructor(
    private db_file = "stocks.sqlite",
    drops: [string, string][] = [],
  ) {
    this.db = new Db(this.db_file, { create: true });
    drops.forEach((drop) => {
      this.drop_query(...(drop as [any, string]));
    });
    this.create_query("ibkr", "transactions");
    this.create_query("all", "accounts");
    this.create_query("all", "positions");
  }
  select = {
    ibkr_transactions: (conid: number) =>
      this.select_query(
        "ibkr",
        "transactions",
        ["conid", "=", conid],
        ["date", "ASC"],
        ["id"],
      ) as ibkr_t.transaction_t[],
    accounts: (broker: broker_t) =>
      this.select_query(
        "all",
        "accounts",
        ["broker", "=", broker],
        ["alias", "ASC"],
      ) as account_t[],
    positions: (broker: broker_t) =>
      this.select_query(
        "all",
        "positions",
        ["broker", "=", broker],
        ["description", "ASC"],
      ) as position_t[],
  };
  insert = {
    ibkr_transactions: (transactions: ibkr_t.transaction_t[]) =>
      this.insert_query("ibkr", "transactions", transactions),
    accounts: (accounts: account_t[]) =>
      this.insert_query("all", "accounts", accounts),
    positions: (positions: position_t[]) =>
      this.insert_query("all", "positions", positions),
  };

  private create_query<T extends db.broker_n, C extends db.table_n<T>>(
    broker: T,
    table: C,
  ) {
    const sql_string = sql.create(broker, table);
    return this.db.query(sql_string).run();
  }
  private drop_query<T extends db.broker_n, C extends db.table_n<T>>(
    broker: T,
    table: C,
  ) {
    const sql_string = sql.drop(broker, table);
    return this.db.query(sql_string).run();
  }
  private insert_query<T extends db.broker_n, C extends db.table_n<T>>(
    broker: T,
    table: C,
    data: db.data_t[],
  ) {
    const sql_string = sql.insert(broker, table, data);
    console.log(sql_string);
    return this.db.query(sql_string).run();
  }
  private select_query<T extends db.broker_n, C extends db.table_n<T>>(
    broker: T,
    table: C,
    condition: db.con_t<T, C>,
    sort: db.sort_t<T, C>,
    ignore?: db.ignore_t<T, C>,
  ) {
    const sql_string = sql.select(broker, table, condition, sort, ignore);
    return this.db.query(sql_string).all();
  }
  private db: Db;
}
