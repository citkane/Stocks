declare global {
  namespace db {
    type data_t =
      | b.i.transaction_t
      | account_t
      | transaction_t
      | fx_rates_t
      | { broker: broker_t; time: number };
    type tables_t = (typeof Tables)["tables"];
    type table_n = keyof tables_t;
    type table_t<T extends table_n> = tables_t[T];
    type col_n<T extends table_n> = (tables_t[T] &
      readonly (readonly [string, string])[])[number][0];
    type condition_t<T extends table_n> = [col_n<T>, string | number];
    type sort_t<T extends table_n> = [col_n<T>, "ASC" | "DESC"];
    type ignore_t<T extends table_n> = col_n<T>[];
  }
}

export class Tables {
  static get tables() {
    return {
      //ibkr_transactions: [
      //  ["id", "VARCHAR PRIMARY KEY"],
      //  ["conid", "INT"],
      //  ["cur", "CHAR(3) NOT NULL"],
      //  ["date", "DATETIME NOT NULL"],
      //  ["rawDate", "VARCHAR NOT NULL"],
      //  ["fxRate", "DECIMAL(38,5) NOT NULL"],
      //  ["pr", "DECIMAL(38,2)"],
      //  ["qty", "SMALLINT"],
      //  ["acctid", "VARCHAR NOT NULL"],
      //  ["amt", "DECIMAL(38,5) NOT NULL"],
      //  ["type", "VARCHAR NOT NULL"],
      //  ["desc", "VARCHAR NOT NULL"],
      //],
      transactions: [
        ["id", "VARCHAR PRIMARY KEY NOT NULL"],
        ["p_id", "VARCHAR NOT NULL"],
        ["con_id", "VARCHAR NOT NULL"],
        ["a_id", "VARCHAR NOT NULL"],
        ["broker", "CHAR(4) NOT NULL"],
        ["description", "VARCHAR NOT NULL"],
        ["ticker", "VARCHAR NOT NULL"],
        ["currency", "CHAR(3) NOT NULL"],
        ["exchange", "VARCHAR NOT NULL"],
        ["amount", "SMALLINT"],
        ["fx_traded", "DECIMAL(38,5)"],
        ["price_traded", "DECIMAL(38,2)"],
        ["date", "DATETIME NOT NULL"],
        ["kind", "VARCHAR NOT NULL"],
      ],
      transactions_updated: [
        ["broker", "VARCHAR PRIMARY KEY"],
        ["time", "DATETIME NOT NULL"],
      ],
      accounts: [
        ["a_id", "VARCHAR PRIMARY KEY"],
        ["a_id_original", "VARCHAR NOT NULL"],
        ["broker", "CHAR(4) NOT NULL"],
        ["alias", "VARCHAR"],
        ["currency", "CHAR(3) NOT NULL"],
      ],
      //positions: [
      //  ["p_id", "VARCHAR PRIMARY KEY"],
      //  ["con_id", "VARCHAR NOT NULL"],
      //  ["broker", "CHAR(4) NOT NULL"],
      //  ["a_id", "VARCHAR NOT NULL"],
      //  ["description", "VARCHAR NOT NULL"],
      //  ["ticker", "VARCHAR NOT NULL"],
      //  ["currency", "CHAR(3) NOT NULL"],
      //  ["exchange", "VARCHAR NOT NULL"],
      //  ["amount", "SMALLINT"],
      //  ["fx_market", "DECIMAL(38,8) NOT NULL"],
      //  ["fx_traded", "DECIMAL(38,8) NOT NULL"],
      //  ["date", "INT NOT NULL"],
      //  ["price_market", "DECIMAL(38,8) NOT NULL"],
      //  ["price_traded", "DECIMAL(38,8) NOT NULL"],
      //  ["kind", "CHAR(8) NOT NULL"],
      //],
      charts_: [
        ["time", "DATETIME PRIMARY KEY"],
        ["open", "NUMERIC NOT NULL"],
        ["close", "NUMERIC NOT NULL"],
        ["high", "NUMERIC NOT NULL"],
        ["low", "NUMERIC NOT NULL"],
        ["volume", "NUMERIC NOT NULL"],
      ],
    } as const;
  }
  static get table_names() {
    return Object.keys(this.tables).filter(
      (name) => !name.endsWith("_"),
    ) as db.table_n[];
  }
}
