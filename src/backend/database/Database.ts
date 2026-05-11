import { Sql } from "./Sql";

export class Database extends Sql {
  public select = {
    transctns: (broker?: broker_t) => {
      return this.sql.select(
        "transactions",
        broker ? ["broker", broker] : undefined,
        ["date", "DESC"],
      ) as Promise<transctn_t[]>;
    },
    transctns_update_date: (broker: broker_t) => {
      return this.sql
        .select(
          "transactions",
          ["broker", broker],
          undefined,
          undefined,
          "date",
        )
        .then((data) => data[0]?.date) as Promise<number | undefined>;
    },
    chart: (id: string) => this.sql.select_chart(id) as Promise<chart_data_t[]>,
    instruments: () => this.sql.select("instruments") as Promise<instrmnt_t[]>,
  };

  public insert = {
    transactions: (transactions: transctn_t[]) => {
      if (!transactions.length) return Promise.resolve();
      return this.sql.insert("transactions", transactions);
    },
    instruments: (instruments: instrmnt_t[]) => {
      return this.sql.insert("instruments", instruments);
    },
    chart: (id: string, data: chart_data_t[]) => {
      return this.sql.insert_chart(id, data);
    },
  };
}
