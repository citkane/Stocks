declare global {
  namespace db {
    type data_t =
      | balance_t
      | transctn_t
      | instrmnt_t
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
      transactions: [
        ["id", "VARCHAR PRIMARY KEY NOT NULL"],
        ["p_id", "VARCHAR NOT NULL"],
        ["a_id", "VARCHAR NOT NULL"],
        ["i_id", "VARCHAR NOT NULL"],
        ["broker", "CHAR(4) NOT NULL"],
        ["currency", "CHAR(3) NOT NULL"],
        ["amount", "SMALLINT"],
        ["fx_traded", "DECIMAL(38,5)"],
        ["price_traded", "DECIMAL(38,2)"],
        ["date", "DATETIME NOT NULL"],
        ["kind", "VARCHAR NOT NULL"],
      ],
      instruments: [
        ["i_id", "VARCHAR PRIMARY KEY NOT NULL"],
        ["exchange", "VARCHAR NOT NULL"],
        ["currency", "CHAR(3) NOT NULL"],
        ["ticker", "VARCHAR NOT NULL"],
        ["saxo_id", "SMALLINT"],
        ["ibkr_id", "SMALLINT"],
        ["description", "VARCHAR NOT NULL"],
        ["about_instrmnt", "VARCHAR"],
        ["asset_class", "VARCHAR"],
        ["asset_sector", "VARCHAR"],
        ["asset_industry", "VARCHAR"],
        ["svg_string", "VARCHAR"],
        ["website", "VARCHAR"],
        ["isin", "VARCHAR"],
        ["cfi", "VARCHAR"],
      ],
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
