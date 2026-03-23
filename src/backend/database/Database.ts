import { Sql } from "./Sql";

export class Database extends Sql {
  constructor(sql_file: string, drop_tables: db.table_n[] = []) {
    super(sql_file);
    this.drop_tables(drop_tables).then(this.create_tables);
  }

  public select = {
    ibkr_transactions: (conid: number) => {
      return this.sql.select(
        "ibkr_transactions",
        ["conid", "=", conid],
        ["date", "ASC"],
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
  };

  public insert = {
    ibkr_transactions: (transactions: ibkr_t.transaction_t[]) => {
      return this.sql.insert("ibkr_transactions", transactions);
    },
    accounts: (accounts: account_t[]) => {
      return this.sql.insert("accounts", accounts);
    },
    positions: (positions: position_t[]) => {
      if (!positions.length) throw Error("No positions");

      return this.sql.insert("positions", positions);
    },
  };
  private drop_tables = (tables: db.table_n[]) => {
    return Promise.all(tables.map(this.sql.drop));
  };
  private create_tables = () => {
    return Promise.all(this.table_names.map(this.sql.create));
  };
}
