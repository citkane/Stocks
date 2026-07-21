import { Sql } from "./Sql";

export class Database extends Sql {
  public select = {
    transctns: {
      data: <T extends "view_transctns", C extends db.tbl.col_names<T>>(
        condition?: db.condition<T>,
        cols?: C[],
        sort?: db.sort<T>,
      ) => {
        return this.sql.select("view_transctns", condition, sort, cols);
      },
      last_update: (broker: g.broker) => {
        return this.sql
          .select("transaction_update", ["broker", broker], undefined, ["date"])
          .then((u) => u[0]?.date);
      },
    },
    instrmnts: <T extends "instrmnt", C extends db.tbl.col_names<T>>(
      condition?: db.condition<T>,
      cols?: C[],
    ) => {
      return this.sql.select("instrmnt", condition, undefined, cols);
    },
    meta_view: () => {
      return this.sql.select("view_instrmnt_meta");
    },
    meta: () => {
      return this.sql.select("instrmnt_meta");
    },
    geo: {
      locatn_search: async () => {
        return this.sql.select("view_locatns");
      },
      qid_map: () => {
        return this.sql.select("view_qid_map").then((json) => json[0]!.geo_map);
      },
    },
    live: {
      forex: async () => {
        return this.sql.select("live_forex");
      },
      instrmnts: async () => {
        return this.sql.select("live_instrmnt");
      },
      balances: async () => {
        return this.sql.select("live_balances");
      },
      chart: (id: string) => {
        return this.sql.chart.select(id) as Promise<lv.chart_data[]>;
      },
    },
    accounts: <T extends "accounts", C extends db.tbl.col_names<T>>(
      condition?: db.condition<T>,
      cols?: C[],
    ) => {
      return this.sql.select("accounts", condition, undefined, cols);
    },
    id_join: <T extends "id_join", C extends db.tbl.col_names<T>>(
      cols?: C[],
    ) => {
      return this.sql.select("id_join", undefined, undefined, cols);
    },
    //{
    //  broker: (broker?: g.broker) => {
    //    return this.sql.select(
    //      "accounts",
    //      broker ? ["broker", broker] : undefined,
    //    );
    //  },
    //},
  };
  public insert = {
    transctns: {
      data: async (transactions: db.data<"transactions">[]) => {
        if (!transactions.length) return undefined;
        return this.sql.insert("transactions", transactions);
      },
      last_update: (broker: g.broker, date: number) => {
        return this.sql.insert("transaction_update", [{ broker, date }], true);
      },
    },
    geo: {
      locatn: (loctns: db.data<"meta_location">[]) => {
        return this.sql.insert("meta_location", loctns, true);
      },

      country: async (cntries: db.data<"geo_country">[]) => {
        return this.sql.insert("geo_country", cntries, true);
        //const ex_cntry = await this.sql
        //  .select("geo_country", ["qid", cntry.qid])
        //  .then((r) => r[0]);
        //
        //return !ex_cntry
        //  ? this.sql.insert("geo_country", [cntry])
        //  : this.update.instrmnts_country(cntry, ex_cntry);
      },
      region: (regions: db.data<"geo_region">[]) => {
        return this.sql.insert("geo_region", regions, true);
      },
      place: async (plces: db.data<"geo_place">[]) => {
        return this.sql.insert("geo_place", plces, true);

        //        const ex_plce = await await this.sql
        //          .select("geo_place", ["qid", plcs.qid])
        //          .then((r) => r[0]);
        //
        //        return !ex_plce
        //          ? this.sql.insert("geo_place", [plcs])
        //          : this.update.instrmnts_place(plcs, ex_plce);
      },
    },
    live: {
      instrmnts: async (data: db.data<"live_instrmnt">[]) => {
        return this.sql.insert("live_instrmnt", data, true);
      },
      forex: async (forex: db.data<"live_forex">[]) => {
        return this.sql.insert("live_forex", forex, true);
      },
      balances: async (balances: db.data<"live_balances">[]) => {
        if (!balances.length) return;
        return this.sql.insert("live_balances", balances, true);
      },
      chart: (id: string, data: db.data<"live_chart">[]) => {
        return this.sql.chart.insert(id, data);
      },
    },
    accounts: (accounts: db.data<"accounts">[]) => {
      if (!accounts.length) return;
      return this.sql.insert("accounts", accounts);
    },

    instrumnts: (instrmnts: db.data<"instrmnt">[]) => {
      return this.sql.insert("instrmnt", instrmnts);
    },
    meta: (meta: db.data<"instrmnt_meta">[]) => {
      return this.sql.insert("instrmnt_meta", meta);
    },
    id_join: (joins: db.data<"id_join">[]) => {
      return this.sql.insert("id_join", joins);
    },
  };
  public debug = <T>(ctx = "unknown", res: T) => {
    const { count, command, lastInsertRowid, affectedRows } = res as any;
    logger.info(`[${ctx}]`, {
      count,
      command,
      lastInsertRowid,
      affectedRows,
    });
    return res;
  };
}
