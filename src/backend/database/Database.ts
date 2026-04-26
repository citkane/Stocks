import { Sql } from "./Sql";

export class Database extends Sql {
  public select = {
    accounts: (broker?: broker_t) => {
      return this.sql.select(
        "accounts",
        broker ? ["broker", broker] : undefined,
        ["alias", "ASC"],
      ) as Promise<account_t[]>;
    },
    transctns: (broker?: broker_t) => {
      return this.sql.select(
        "transactions",
        broker ? ["broker", broker] : undefined,
        ["date", "DESC"],
      ) as Promise<transctn_t[]>;
    },
    transctns_update_date: (broker: broker_t) => {
      return this.sql
        .select("transactions_updated", ["broker", broker])
        .then((data) => {
          return data[0] ? data[0].time : undefined;
        }) as Promise<number | undefined>;
    },
    chart: (id: string) => this.sql.select_chart(id),
    instruments: () => this.sql.select("instruments") as Promise<instrmnt_t[]>,
  };

  public insert = {
    transctns_update_date: (broker: broker_t, time: number) => {
      return this.sql.insert("transactions_updated", [{ broker, time }]);
    },
    transactions: (transactions: transctn_t[]) => {
      if (!transactions.length) return Promise.resolve();
      return this.sql.insert("transactions", transactions);
    },
    accounts: (accounts: account_t[]) => {
      return this.sql.insert("accounts", accounts);
    },
    instruments: (instruments: instrmnt_t[]) => {
      return this.sql.insert("instruments", instruments);
    },
    chart: (id: string, data: chart_data_t[]) => {
      return this.sql.insert_chart(id, data);
    },
  };

  public update = {
    transctns_update_date: (broker: broker_t, time: number) => {
      return this.sql.update("transactions_updated", { broker, time }, [
        "broker",
        broker,
      ]);
    },
  };
}
