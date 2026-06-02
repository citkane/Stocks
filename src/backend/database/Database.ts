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
    chart: (id: string) => {
      console.log("select chart");

      return this.sql.select_chart(id) as Promise<chart_data_t[]>;
    },
    instruments: () => {
      return this.sql.select("instruments") as Promise<instrmnt_t[]>;
    },
    location_search: (search: string) => {
      return this.sql
        .select("location_search", ["search", search])
        .then((res) => res[0]) as Promise<geo_data_t | undefined>;
    },
    country_search: async (country_search?: string) => {
      if (!country_search) return undefined;
      return this.sql
        .select("instrument_country", ["search", country_search])
        .then((res) => res[0]) as Promise<
        db.data_t<"instrument_country"> | undefined
      >;
    },
    country: (country_qid: string) => {
      return this.sql
        .select("instrument_country", ["qid", country_qid])
        .then((res) => res[0]) as Promise<
        db.data_t<"instrument_country"> | undefined
      >;
    },
    region: (region_qid: string) => {
      return this.sql
        .select("instrument_region", ["qid", region_qid])
        .then((res) => res[0]) as Promise<
        db.data_t<"instrument_region"> | undefined
      >;
    },
  };

  public insert = {
    transactions: (transactions: db.data_t<"transactions">[]) => {
      if (!transactions.length) return Promise.resolve();
      return this.sql.insert("transactions", transactions);
    },
    instruments: (instruments: instrmnt_t[]) => {
      const parts = this.parts_instrmnt(instruments);
      const { instrmnt, meta } = parts;
      const { instrmnts_part, instrmnts_meta } = this.insert;
      return Promise.all([instrmnts_part(instrmnt), instrmnts_meta(meta)]);
    },
    instrmnts_part: (instrmnts: db.data_t<"instrument">[]) => {
      return this.sql.insert("instrument", instrmnts);
    },
    instrmnts_meta: (instrmnts: db.data_t<"instrument_meta">[]) => {
      return this.sql.insert("instrument_meta", instrmnts);
    },
    instrmnts_location: (locations: db.data_t<"instrument_location">[]) => {
      return this.sql.insert("instrument_location", locations);
    },
    instrmnts_country: (countries: db.data_t<"instrument_country">[]) => {
      return this.sql.insert("instrument_country", countries);
    },
    instrmnts_region: (regions: db.data_t<"instrument_region">[]) => {
      return this.sql.insert("instrument_region", regions);
    },
    instrmnts_place: (places: db.data_t<"instrument_place">[]) => {
      return this.sql.insert("instrument_place", places);
    },
    chart: (id: string, data: chart_data_t[]) => {
      return this.sql.insert_chart(id, data);
    },
  };
  public update = {
    instrmnts_country: async (country: db.data_t<"instrument_country">) => {
      const { search, qid } = country;
      if (!search) return;
      return this.sql.update("instrument_country", country, ["qid", qid]);
    },
  };
  private parts_instrmnt = (instrmnts: instrmnt_t[]) => {
    const collect = {
      instrmnt: [] as db.data_t<"instrument">[],
      meta: [] as db.data_t<"instrument_meta">[],
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
        cfi,
        svg_logo,
      } = instrmnt;
      collect.instrmnt.push({
        i_id,
        exchange,
        currency,
        ticker,
        ibkr_id,
        saxo_id,
      });
      collect.meta.push({
        i_id,
        description,
        about_instrmnt,
        asset_class,
        asset_sector,
        asset_industry,
        website,
        isin,
        cfi,
        svg_logo,
      });
      return collect;
    }, collect);
  };
}
