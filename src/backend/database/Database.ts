import { Database as Db } from "bun:sqlite";
import { Sql } from "./Sql";

export class Database extends Sql {
  constructor(
    private db_file: string,
    drops: db.table_n[] = [],
  ) {
    super();

    this.dbase = new Db(this.db_file, { create: true });
    drops.forEach(this.drop_table);
    setTimeout(() => this.table_names.forEach(this.create_table));
  }
  public select = {
    ibkr_transactions: (conid: number) => {
      return this.select_rows(
        "ibkr_transactions",
        ["conid", "=", conid],
        ["date", "ASC"],
        ["id"],
      ).all() as ibkr_t.transaction_t[];
    },
    accounts: (broker: broker_t) => {
      return this.select_rows(
        "accounts",
        ["broker", "=", broker],
        ["alias", "ASC"],
      ).all() as account_t[];
    },
    positions: (broker: broker_t) => {
      return this.select_rows(
        "positions",
        ["broker", "=", broker],
        ["description", "ASC"],
      ).all() as position_t[];
    },
    fx_rates: () => {
      return this.select_rows("fx_rates").get() as fx_rates_t;
    },
  };

  public insert = {
    ibkr_transactions: (transactions: ibkr_t.transaction_t[]) => {
      this.insert_rows("ibkr_transactions", transactions);
    },
    accounts: (accounts: account_t[]) => {
      this.insert_rows("accounts", accounts);
    },
    positions: (positions: position_t[]) => {
      this.insert_rows("positions", positions);
    },
    fx_rates: (rates: fx_rates_t) => {
      this.insert_rows("fx_rates", [rates]);
    },
  };

  private create_table = <T extends db.table_n>(table: T) => {
    const sql_string = this.sql.create(table);
    return this.dbase.query(sql_string).run();
  };
  private drop_table = (table: db.table_n) => {
    const sql_string = this.sql.drop(table);
    this.dbase.query(sql_string).run();
  };
  private insert_rows = <T extends db.table_n>(table: T, data: db.data_t[]) => {
    const sql_string = this.sql.insert(table, data);
    this.dbase.query(sql_string).run();
  };
  private select_rows = <T extends db.table_n>(
    table: T,
    condition?: db.condition_t<T>,
    sort?: db.sort_t<T>,
    ignore?: db.ignore_t<T>,
  ) => {
    const sql_string = this.sql.select(table, condition, sort, ignore);
    return this.dbase.query(sql_string);
  };
  private dbase: Db;
}
