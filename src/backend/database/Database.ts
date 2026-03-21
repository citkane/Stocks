import { Sql } from "./Sql";

export class Database extends Sql {
  constructor(sql_file: string, drop_tables: db.table_n[] = []) {
    super(sql_file);
    Promise.all(drop_tables.map(this.sql.drop)).then(this.create_tables);
    //setTimeout(() => this.table_names.forEach(this.sql.create));
  }

  public select = {
    ibkr_transactions: (conid: number) => {
      return this.sql.select(
        "ibkr_transactions",
        ["conid", "=", conid],
        ["date", "ASC"],
        ["id"],
      ) as Promise<ibkr_t.transaction_t[]>;
    },
    accounts: (broker: broker_t) => {
      return this.sql.select(
        "accounts",
        ["broker", "=", broker],
        ["alias", "ASC"],
      ) as Promise<account_t[]>;
    },
    positions: (broker: broker_t) => {
      return this.sql.select(
        "positions",
        ["broker", "=", broker],
        ["description", "ASC"],
      ) as Promise<position_t[]>;
    },
    fx_rates: () => {
      return this.sql
        .select("fx_rates")
        .then((rows) => rows[0]) as Promise<fx_rates_t>;
    },
  };

  public insert = {
    ibkr_transactions: (transactions: ibkr_t.transaction_t[]) => {
      return this.sql.insert("ibkr_transactions", transactions);
    },
    accounts: (accounts: account_t[]) => {
      return this.sql.insert("accounts", accounts);
    },
    positions: (positions: position_t[]) => {
      return this.sql.insert("positions", positions);
    },
    fx_rates: (rates: fx_rates_t) => {
      return this.sql.insert("fx_rates", [rates]);
    },
  };

  private create_tables = () => {
    return Promise.all(this.table_names.map(this.sql.create));
  };
  //private create_table = <T extends db.table_n>(table: T) => {
  //  const sql_string = this.sql.create(table);
  //  return this.dbase.query(sql_string).run();
  //};
  //private drop_table = (table: db.table_n) => {
  //  const sql_string = this.sql.drop(table);
  //  //this.dbase.query(sql_string).run();
  //};
  //private insert_rows = <T extends db.table_n>(table: T, data: db.data_t[]) => {
  //  return this.sql.insert(table, data);
  //};
  //private select_rows = <T extends db.table_n>(
  //  table: T,
  //  condition?: db.condition_t<T>,
  //  sort?: db.sort_t<T>,
  //  ignore?: db.ignore_t<T>,
  //) => {
  //  const sql_string = this.sql.select(table, condition, sort, ignore);
  //  return this.dbase.query(sql_string);
  //};
}
