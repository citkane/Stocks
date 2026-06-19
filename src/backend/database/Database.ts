import { Sql } from "./Sql";

export class Database extends Sql {
  public select = {
    accounts: (broker?: broker_t) => {
      return this.sql.select(
        "accounts",
        broker ? ["broker", broker] : undefined,
      );
    },
    transactions: (broker?: broker_t) => {
      return this.sql.select(
        "transactions",
        broker ? ["broker", broker] : undefined,
        ["date", "DESC"],
      );
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
    chart: (id: string) => {
      return this.sql.select_chart(id) as Promise<chart_data_t[]>;
    },
    instruments: (broker?: broker_t) => {
      return this.sql
        .select("instruments", broker ? [`${broker}_id`, true] : undefined)
        .then((r) => r as instrmnt_t[]);
    },
    instrument: (broker: broker_t, broker_id: number) => {
      return this.sql
        .select("instrument", [`${broker}_id`, broker_id])
        .then((res) => res[0] as Partial<instrmnt_t> | undefined);
    },
    locatn_search: async (place?: string) => {
      if (!place) return undefined;
      return this.sql
        .select("location_search", ["search", place])
        .then((r) => r[0]);
    },
    country_search: async (country?: string) => {
      if (!country) return undefined;

      return this.sql
        .select("instrument_country", ["search", country])
        .then((r) => r[0]);
    },
    place: async (place_qid?: string) => {
      if (!place_qid) return undefined;
      return this.sql
        .select("instrument_place", ["qid", place_qid])
        .then((r) => r[0]);
    },
    country: async (country_qid?: string) => {
      if (!country_qid) return undefined;
      return this.sql
        .select("instrument_country", ["qid", country_qid])
        .then((r) => r[0]);
    },
    region: async (region_qid?: string) => {
      if (!region_qid) return undefined;
      return this.sql
        .select("instrument_region", ["qid", region_qid])
        .then((r) => r[0]);
    },
    forex: async () =>
      this.sql.select("forex").then((r) => {
        const forex = {} as cache_t["forex"];
        return r.reduce((forex, fx) => {
          forex[fx.currency] = fx;
          return forex;
        }, forex);
      }),
    instrument_data: async () =>
      this.sql.select("instrument_data").then((r) => {
        const data = {} as cache_t["instrument_data"];
        return r.reduce((data, i) => {
          data[i.i_id] = i;
          return data;
        }, data);
      }),
    balances: async () =>
      this.sql.select("balances").then((r) => {
        const balances = {} as cache_t["balances"];
        return r.reduce((data, b) => {
          data[b.a_id] = b;
          return data;
        }, balances);
      }),
  };
  public insert = {
    accounts: async (accounts: account_t[]) => {
      if (!accounts.length) return;
      return this.sql.insert("accounts", accounts);
    },
    transactions: async (transactions: db.data<"transactions">[]) => {
      if (!transactions.length) return undefined;
      return this.sql.insert("transactions", transactions);
    },
    instruments: (instruments: Partial<instrmnt_t>[]) => {
      const parts = this.parts_instrmnt(instruments);
      const { instrmnt, meta } = parts;
      const { instrmnts_part, instrmnts_meta } = this.insert;
      return Promise.all([instrmnts_part(instrmnt), instrmnts_meta(meta)]);
    },
    instrmnts_part: (instrmnts: db.data<"instrument">[]) => {
      return this.sql.insert("instrument", instrmnts);
    },
    instrmnts_meta: (instrmnts: db.data<"instrument_meta">[]) => {
      return this.sql.insert("instrument_meta", instrmnts);
    },
    instrmnts_location: (location: db.data<"instrument_location">) => {
      return this.sql.insert("instrument_location", [location]);
    },
    instrmnts_country: async (cntry: db.data<"instrument_country">) => {
      const ex_cntry = await this.select.country(cntry.qid);
      return !ex_cntry
        ? this.sql.insert("instrument_country", [cntry])
        : this.update.instrmnts_country(cntry, ex_cntry);
    },
    instrmnts_region: (region: db.data<"instrument_region">) => {
      return this.sql.insert("instrument_region", [region]);
    },
    instrmnts_place: async (plce: db.data<"instrument_place">) => {
      const ex_plce = await this.select.place(plce.qid);
      return !ex_plce
        ? this.sql.insert("instrument_place", [plce])
        : this.update.instrmnts_place(plce, ex_plce);
    },
    forex: async (forex: cache_t["forex"]) => {
      const data = Object.values(forex);
      if (!data.length) return undefined;
      //await this.sql.drop("forex");
      return this.sql.insert("forex", data);
    },
    instrument_data: async (ins_data: cache_t["instrument_data"]) => {
      const data = Object.values(ins_data);
      if (!data.length) return undefined;
      return this.sql.insert("instrument_data", data);
    },
    balances: async (balances: cache_t["balances"]) => {
      const data = Object.values(balances);
      if (!data.length) return undefined;
      return this.sql.insert("balances", data);
    },
    chart: (id: string, data: chart_data_t[]) => {
      return this.sql.insert_chart(id, data);
    },
  };
  public update = {
    instrmnts_country: async (
      cntry: db.data<"instrument_country">,
      ex_cntry: db.data<"instrument_country">,
    ) => {
      const { qid, search } = cntry;
      cntry.search = [...new Set([...(search || []), ...ex_cntry.search])];
      return this.sql.update("instrument_country", cntry, [
        "qid",
        qid as string,
      ]);
    },
    instrmnts_place: async (
      plce: db.data<"instrument_place">,
      ex_plce: db.data<"instrument_place">,
    ) => {
      const { qid, search } = plce;
      plce.search = [...new Set([...search, ...ex_plce.search])];
      return this.sql.update("instrument_place", plce, ["qid", qid]);
    },
  };

  private parts_instrmnt = (instrmnts: Partial<instrmnt_t>[]) => {
    const collect = {
      instrmnt: [] as db.data<"instrument">[],
      meta: [] as db.data<"instrument_meta">[],
    };
    return instrmnts.reduce((collect, instrmnt) => {
      const {
        i_id,
        exchange,
        currency,
        ticker,
        ibkr_id,
        saxo_id,
        description,
        about_instrmnt,
        asset_class,
        asset_sector,
        asset_industry,
        website,
        isin,
        svg_logo,
      } = instrmnt;
      collect.instrmnt.push({
        i_id: i_id!,
        exchange: exchange!,
        currency: currency!,
        ticker: ticker!,
        ibkr_id,
        saxo_id,
      });
      collect.meta.push({
        i_id: i_id!,
        description: description!,
        about_instrmnt,
        asset_class,
        asset_sector,
        asset_industry,
        website,
        isin,
        svg_logo,
      });
      return collect;
    }, collect);
  };
}
