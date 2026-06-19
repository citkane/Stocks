const char_prim = def("VARCHAR PRIMARY KEY");
const char = "VARCHAR";
const char_def = def(char);
const dec_5 = "DECIMAL(38,5)";
const dec_2 = "DECIMAL(38,2)";
const dec_2_def = def(dec_2);
function def(key: string) {
  return `${key} NOT NULL`;
}

export class Tables {
  static get tables() {
    return {
      accounts: [
        ["a_id", "VARCHAR PRIMARY KEY NOT NULL"] as unknown as ["a_id", a_id_t],
        //["a_id_original", "VARCHAR NOT NULL"] as unknown as [
        //  "a_id_original",
        //  string,
        //],
        ["broker", "CHAR(4) NOT NULL"] as unknown as ["broker", broker_t],
        ["currency", "CHAR(3) NOT NULL"] as unknown as ["currency", string],
        ["alias", "VARCHAR"] as unknown as ["alias", string, "o"],
        ["broker_key", "VARCHAR"] as unknown as ["broker_key", string, "o"],
      ],
      transactions: [
        ["id", "VARCHAR PRIMARY KEY NOT NULL"] as unknown as ["id", string],
        ["p_id", "VARCHAR NOT NULL"] as unknown as ["p_id", p_id_t],
        ["a_id", "VARCHAR NOT NULL"] as unknown as ["a_id", string],
        ["i_id", "VARCHAR NOT NULL"] as unknown as ["i_id", i_id_t],
        ["broker", "CHAR(4) NOT NULL"] as unknown as ["broker", broker_t],
        ["currency", "CHAR(3) NOT NULL"] as unknown as ["currency", string],
        ["amount", "SMALLINT"] as unknown as ["amount", number, "o"],
        ["fx_traded", "DECIMAL(38,5)"] as unknown as ["fx_traded", number, "o"],
        ["price_traded", "DECIMAL(38,2)"] as unknown as [
          "price_traded",
          number,
          "o",
        ],
        ["date", "DATETIME NOT NULL"] as unknown as ["date", number],
        ["kind", "VARCHAR NOT NULL"] as unknown as ["kind", transctn_t["kind"]],
      ],
      instrument: [
        ["i_id", "VARCHAR PRIMARY KEY NOT NULL"] as unknown as ["i_id", i_id_t],
        ["exchange", "VARCHAR NOT NULL"] as unknown as ["exchange", string],
        ["currency", "CHAR(3) NOT NULL"] as unknown as ["currency", string],
        ["ticker", "VARCHAR NOT NULL"] as unknown as ["ticker", string],
        ["saxo_id", "SMALLINT"] as unknown as ["saxo_id", number, "o"],
        ["ibkr_id", "SMALLINT"] as unknown as ["ibkr_id", number, "o"],
      ],
      instrument_meta: [
        ["i_id", "VARCHAR PRIMARY KEY NOT NULL"] as unknown as ["i_id", i_id_t],
        ["description"] as unknown as ["description", string],
        ["about_instrmnt"] as unknown as ["about_instrmnt", string, "o"],
        ["asset_class"] as unknown as ["asset_class", string, "o"],
        ["asset_sector"] as unknown as ["asset_sector", string, "o"],
        ["asset_industry"] as unknown as ["asset_industry", string, "o"],
        ["website"] as unknown as ["website", string, "o"],
        ["isin"] as unknown as ["isin", string, "o"],
        //["cfi"] as unknown as [string, string_],
        ["svg_logo"] as unknown as ["svg_logo", string, "o"],
      ],
      instrument_location: [
        ["i_id", "VARCHAR PRIMARY KEY NOT NULL"] as unknown as ["i_id", i_id_t],
        ["country_qid", "VARCHAR"] as unknown as ["country_qid", string, "o"],
        ["place_qid", "VARCHAR"] as unknown as ["place_qid", string, "o"],
        ["region_qid", "VARCHAR"] as unknown as ["region_qid", string, "o"],
      ],
      instrument_country: [
        ["qid", "VARCHAR PRIMARY KEY NOT NULL"] as unknown as ["qid", string],
        ["search", "TEXT NOT NULL", "j"] as unknown as [
          "search",
          string[],
          "j",
        ],
        ["name", "VARCHAR NOT NULL"] as unknown as ["name", string],
        ["geo_shape", "VARCHAR"] as unknown as ["geo_shape", string, "o"],
        ["wiki_link", "VARCHAR"] as unknown as ["wiki_link", string, "o"],
      ],
      instrument_region: [
        ["qid", "VARCHAR PRIMARY KEY NOT NULL"] as unknown as ["qid", string],
        ["name", "VARCHAR NOT NULL"] as unknown as ["name", string],
        ["geo_shape", "VARCHAR"] as unknown as ["geo_shape", string, "o"],
        ["geo_point", "VARCHAR"] as unknown as ["geo_point", string, "o"],
        ["wiki_link", "VARCHAR"] as unknown as ["wiki_link", string, "o"],
      ],
      instrument_place: [
        ["qid", "VARCHAR PRIMARY KEY NOT NULL"] as unknown as ["qid", string],
        ["search", "TEXT NOT NULL", "j"] as unknown as [
          "search",
          string[],
          "j",
        ],
        ["name", "VARCHAR NOT NULL"] as unknown as ["name", string],
        ["geo_point", "VARCHAR"] as unknown as ["geo_point", string, "o"],
        ["wiki_link", "VARCHAR"] as unknown as ["wiki_link", string, "o"],
      ],
      charts_: [
        ["time", "DATETIME PRIMARY KEY"],
        ["open", "NUMERIC NOT NULL"],
        ["close", "NUMERIC NOT NULL"],
        ["high", "NUMERIC NOT NULL"],
        ["low", "NUMERIC NOT NULL"],
        ["volume", "NUMERIC NOT NULL"],
      ],
      instruments: [
        ["i_id"] as unknown as ["i_id", i_id_t],
        ["exchange"] as unknown as ["exchange", string],
        ["currency"] as unknown as ["currency", string],
        ["ticker"] as unknown as ["ticker", string],
        ["saxo_id"] as unknown as ["saxo_id", number, "o"],
        ["ibkr_id"] as unknown as ["ibkr_id", number, "o"],
        ["description"] as unknown as ["description", string],
        ["about_instrmnt"] as unknown as ["about_instrmnt", string, "o"],
        ["asset_class"] as unknown as ["asset_class", string, "o"],
        ["asset_sector"] as unknown as ["asset_sector", string, "o"],
        ["asset_industry"] as unknown as ["asset_industry", string, "o"],
        ["website"] as unknown as ["website", string, "o"],
        ["isin"] as unknown as ["isin", string, "o"],
        //["cfi"] as unknown as [string, string_],
        ["svg_logo"] as unknown as ["svg_logo", string, "o"],
        ["country"] as unknown as ["country", string, "o"],
        ["country_qid"] as unknown as ["country_qid", string, "o"],
        ["country_shape"] as unknown as ["country_shape", string, "o"],
        ["country_link"] as unknown as ["country_link", string, "o"],
        ["region"] as unknown as ["region", string, "o"],
        ["region_qid"] as unknown as ["region_qid", string, "o"],
        ["region_shape"] as unknown as ["region_shape", string, "o"],
        ["region_point"] as unknown as ["region_point", string, "o"],
        ["region_link"] as unknown as ["region_link", string, "o"],
        ["place"] as unknown as ["place", string, "o"],
        ["place_qid"] as unknown as ["place_qid", string, "o"],
        ["place_point"] as unknown as ["place_point", string, "o"],
        ["place_link"] as unknown as ["place_link", string, "o"],
      ],
      location_search: [
        ["search", undefined, "j"] as unknown as ["search", string[], "j"],
        ["place_qid"] as unknown as ["place_qid", string, "o"],
        ["place"] as unknown as ["place", string, "o"],
        ["region_qid"] as unknown as ["region_qid", string, "o"],
        ["country_qid"] as unknown as ["country_qid", string, "o"],
        ["place_point"] as unknown as ["place_point", string, "o"],
        ["place_link"] as unknown as ["place_link", string, "o"],
        ["region"] as unknown as ["region", string, "o"],
        ["region_shape"] as unknown as ["region_shape", string, "o"],
        ["region_point"] as unknown as ["region_point", string, "o"],
        ["region_link"] as unknown as ["region_link", string, "o"],
        ["country"] as unknown as ["country", string, "o"],
        ["country_shape"] as unknown as ["country_shape", string, "o"],
        ["country_link"] as unknown as ["country_link", string, "o"],
      ],
      forex: [
        ["currency", char_prim] as unknown as ["currency", string],
        ["exchange", char_def] as unknown as ["exchange", string],
        ["open", dec_5] as unknown as ["open", number],
        ["close", dec_5] as unknown as ["close", number],
      ],
      instrument_data: [
        ["i_id", char_prim] as unknown as ["i_id", i_id_t],
        ["exchange", char_def] as unknown as ["exchange", string],
        ["current_session", char_def] as unknown as [
          "current_session",
          tv.fields.session,
        ],
        ["currency", char_def] as unknown as ["currency", string],
        ["dividends_yield", dec_5] as unknown as ["dividends_yield", number],
        ["open", dec_2] as unknown as ["open", number],
        ["close", dec_2_def] as unknown as ["close", number],
        ["high", dec_2] as unknown as ["high", number],
        ["low", dec_2] as unknown as ["low", number],
        ["type", char_def] as unknown as ["type", string, "o"],
      ],
      balances: [
        ["a_id", char_prim] as unknown as ["a_id", a_id_t],
        ["currency", char_def] as unknown as ["currency", string],
        ["assets_val", dec_2_def] as unknown as ["assets_val", number],
        ["cash", dec_2_def] as unknown as ["cash", number],
      ],
    } as const;
  }

  //      COALESCE(forex.close, 1) AS fx

  static get views() {
    const pf = "instrument";
    return {
      //      live_data: (() => {
      //        return `
      //CREATE VIEW IF NOT EXISTS live_data
      //AS
      //SELECT DISTINCT
      //      ${pf}_data.i_id,
      //      ${pf}_data.exchange,
      //      ${pf}_data.currency,
      //      ${pf}_data.dividends_yield,
      //      ${pf}_data.open,
      //      ${pf}_data.close,
      //      ${pf}_data.high,
      //      ${pf}_data.low,
      //      ${pf}_data.type,
      //      COALESCE(forex.close, 1) AS fx
      //FROM
      //      ${pf}_data
      //LEFT JOIN forex ON forex.currency = ${pf}_data.currency
      //`.trim();
      //      })(),
      instruments: (() => {
        return `
CREATE VIEW IF NOT EXISTS instruments
AS
SELECT DISTINCT
      ${pf}.i_id,
      ${pf}.exchange,
      ${pf}.currency,
      ${pf}.ticker,
      ${pf}.saxo_id,
      ${pf}.ibkr_id,
      ${pf}_meta.description,
      ${pf}_meta.about_instrmnt,
      ${pf}_meta.asset_class,
      ${pf}_meta.asset_sector,
      ${pf}_meta.asset_industry,
      ${pf}_meta.website,
      ${pf}_meta.isin,
      ${pf}_meta.svg_logo,
      ${pf}_location.country_qid,
      ${pf}_location.region_qid,
      ${pf}_location.place_qid,
      ${pf}_country.name AS country,
      ${pf}_country.geo_shape AS country_shape,
      ${pf}_country.wiki_link AS country_link,
      ${pf}_region.name AS region,
      ${pf}_region.geo_shape AS region_shape,
      ${pf}_region.geo_point AS region_point,
      ${pf}_region.wiki_link AS region_link,
      ${pf}_place.name AS place,
      ${pf}_place.geo_point AS place_point,
      ${pf}_place.wiki_link AS place_link
FROM
      ${pf}
INNER JOIN ${pf}_meta ON ${pf}_meta.i_id = ${pf}.i_id
LEFT JOIN ${pf}_location ON ${pf}_location.i_id = ${pf}.i_id
LEFT JOIN ${pf}_country ON ${pf}_country.qid = ${pf}_location.country_qid
LEFT JOIN ${pf}_region ON ${pf}_region.qid = ${pf}_location.region_qid
LEFT JOIN ${pf}_place ON ${pf}_place.qid = ${pf}_location.place_qid;
`.trim();
      })(),
      location_search: (() => {
        return `
CREATE VIEW IF NOT EXISTS location_search
AS
SELECT DISTINCT
        ${pf}_place.search,
        ${pf}_place.qid AS place_qid,
        ${pf}_location.region_qid AS region_qid,
        ${pf}_location.country_qid AS country_qid,
        ${pf}_place.name AS place,
        ${pf}_place.geo_point AS place_point,
        ${pf}_place.wiki_link AS place_link,
        ${pf}_region.name AS region,
        ${pf}_region.geo_shape AS region_shape,
        ${pf}_region.geo_point AS region_point,
        ${pf}_region.wiki_link AS region_link,
        ${pf}_country.name AS country,
        ${pf}_country.geo_shape AS country_shape,
        ${pf}_country.wiki_link as country_link
FROM
      ${pf}_place
INNER JOIN ${pf}_location ON ${pf}_location.place_qid = ${pf}_place.qid
INNER JOIN ${pf}_region ON ${pf}_region.qid = ${pf}_location.region_qid
INNER JOIN ${pf}_country ON ${pf}_country.qid = ${pf}_location.country_qid; 
`.trim();
      })(),
    } as const;
  }
  static get table_names() {
    return Object.keys(this.tables);
  }
  static get view_names() {
    return Object.keys(this.views);
  }
  static json_tables = Object.keys(this.tables).filter((tbl) =>
    this.tables[tbl as db.tbl.names].find((row) => row[2] === "j"),
  );
  static table_cols = (table: db.tbl.names) =>
    this.tables[table]!.map((r) => r[0]!);
}

declare global {
  namespace db {
    namespace tbl {
      type names = p.table_names;
      type names_json = p.json_table_names;
      type rows<T extends names> = p.table_rows<T>;
      type cols<T extends tbl.names> = p.table_cols<T>;
    }
    type data<T extends tbl.names> = p.data<T, true> & p.data<T, false>;
    type condition<T extends tbl.names> = p.condition<T>;
    type sort<T extends tbl.names> = [tbl.cols<T>, "ASC" | "DESC"];
  }
}

/** Private types */
namespace p {
  export type data<T extends table_names, O extends boolean> = O extends true
    ? keys_optional<T>
    : keys_required<T>;
  export type condition<T extends table_names> = T extends json_table_names
    ? [table_cols<T>, string | number]
    : [table_cols<T>, string | number | boolean];

  export type table_rows<T extends table_names> = tables[T];
  export type table_names = keyof tables;
  export type table_cols<T extends table_names> = table_rows<T>[number][0];
  export type json_table_names = keyof json_tables;

  type json_row_names<T extends table_names> = keyof json_rows<T>;
  type keys_optional<T extends table_names> = {
    [K in table_rows<T>[number] as K[2] extends "o" ? K[0] : never]?: K[1];
  };
  type keys_required<T extends table_names> = {
    [K in table_rows<T>[number] as K[2] extends "o" ? never : K[0]]: K[1];
  };
  type tables = (typeof Tables)["tables"];
  type json_tables = {
    [K in keyof tables as json_row_names<K> extends never
      ? never
      : K]: tables[K];
  };
  type json_rows<T extends table_names> = {
    [K in table_rows<T>[number] as K[2] extends "j" ? K[0] : never]: K;
  } & {
    [K in table_rows<T>[number] as K[3] extends "j" ? K[0] : never]: K;
  };
}
