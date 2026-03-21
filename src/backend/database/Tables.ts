import { Global } from "@backend/Global";

declare global {
  namespace db {
    type data_t = ibkr_t.transaction_t | account_t | position_t | fx_rates_t;
    type tables_t = InstanceType<typeof Tables>["tables"];
    type table_n = keyof tables_t;
    type table_t<T extends table_n> = tables_t[T];
    type col_n<T extends table_n> = (tables_t[T] &
      readonly (readonly [string, string])[])[number][0];
    type condition_t<T extends table_n> = [
      col_n<T>,
      "=" | "<" | ">",
      string | number,
    ];
    type sort_t<T extends table_n> = [col_n<T>, "ASC" | "DESC"];
    type ignore_t<T extends table_n> = col_n<T>[];
  }
}

export class Tables extends Global {
  protected get tables() {
    return {
      ibkr_transactions: [
        ["id", "VARCHAR PRIMARY KEY"],
        ["conid", "INT"],
        ["cur", "CHAR(3) NOT NULL"],
        ["date", "DATETIME NOT NULL"],
        ["fxRate", "DECIMAL(38,5) NOT NULL"],
        ["pr", "DECIMAL(38,2)"],
        ["qty", "SMALLINT"],
        ["acctid", "VARCHAR NOT NULL"],
        ["amt", "DECIMAL(38,5) NOT NULL"],
        ["type", "VARCHAR NOT NULL"],
        ["desc", "VARCHAR NOT NULL"],
      ],
      accounts: [
        ["a_id", "VARCHAR PRIMARY KEY"],
        ["a_id_original", "VARCHAR NOT NULL"],
        ["broker", "CHAR(4) NOT NULL"],
        ["alias", "VARCHAR NOT NULL"],
        ["currency", "CHAR(3) NOT NULL"],
      ],
      positions: [
        ["p_id", "VARCHAR PRIMARY KEY"],
        ["con_id", "VARCHAR NOT NULL"],
        ["broker", "CHAR(4) NOT NULL"],
        ["a_id", "VARCHAR NOT NULL"],
        ["description", "VARCHAR NOT NULL"],
        ["ticker", "VARCHAR NOT NULL"],
        ["currency", "CHAR(3) NOT NULL"],
        ["exchange", "VARCHAR NOT NULL"],
        ["position", "SMALLINT"],
        ["fx_market", "DECIMAL(38,8) NOT NULL"],
        ["fx_buy", "DECIMAL(38,8) NOT NULL"],
        ["date", "INT NOT NULL"],
        ["price_market", "DECIMAL(38,8) NOT NULL"],
        ["price_buy", "DECIMAL(38,8) NOT NULL"],
      ],
      fx_rates: this.fx_rates,
    } as const;
  }
  protected get table_names() {
    return Object.keys(this.tables) as db.table_n[];
  }
  private get fx_rates() {
    return this._fx_rates
      ? this._fx_rates
      : (this._fx_rates = [...this.currencies, this.base_currency].map(
          (currency) => {
            return [currency, "DECIMAL(38,8) NOT NULL"];
          },
        ));
  }
  private _fx_rates?: [string, string][];
}
