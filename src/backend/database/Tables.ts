export class Tables {
  static get tables() {
    return {
      transactions: [
        ["id", "VARCHAR PRIMARY KEY NOT NULL"] as unknown as ["id", string],
        ["p_id", "VARCHAR NOT NULL"] as unknown as ["p_id", string],
        ["a_id", "VARCHAR NOT NULL"] as unknown as ["a_id", string],
        ["i_id", "VARCHAR NOT NULL"] as unknown as ["i_id", i_id_t],
        ["broker", "CHAR(4) NOT NULL"] as unknown as ["broker", broker_t],
        ["currency", "CHAR(3) NOT NULL"] as unknown as ["currency", string],
        ["amount", "SMALLINT"] as unknown as ["amount", number | undefined],
        ["fx_traded", "DECIMAL(38,5)"] as unknown as ["fx_traded", number_],
        ["price_traded", "DECIMAL(38,2)"] as unknown as [
          "price_traded",
          number_,
        ],
        ["date", "DATETIME NOT NULL"] as unknown as ["date", number],
        ["kind", "VARCHAR NOT NULL"] as unknown as ["kind", string],
      ],
      instruments: [
        ["i_id"] as unknown as ["i_id", i_id_t],
        ["exchange"] as unknown as ["exchange", string],
        ["currency"] as unknown as ["currency", string],
        ["ticker"] as unknown as ["ticker", string],
        ["saxo_id"] as unknown as ["saxo_id", number_],
        ["ibkr_id"] as unknown as ["ibkr_id", number_],
        ["description"] as unknown as ["description", string],
        ["about_instrmnt"] as unknown as ["about_instrmnt", string_],
        ["asset_class"] as unknown as ["asset_class", string_],
        ["asset_sector"] as unknown as ["asset_sector", string_],
        ["asset_industry"] as unknown as ["asset_industry", string_],
        ["website"] as unknown as ["website", string_],
        ["isin"] as unknown as [string, string_],
        ["cfi"] as unknown as [string, string_],
        ["svg_logo"] as unknown as [string, string_],
        ["country"] as unknown as [string, string_],
        ["country_qid"] as unknown as [string, string_],
        ["country_shape"] as unknown as [string, string_],
        ["country_link"] as unknown as [string, string_],
        ["region"] as unknown as [string, string_],
        ["region_qid"] as unknown as [string, string_],
        ["region_shape"] as unknown as [string, string_],
        ["region_point"] as unknown as [string, string_],
        ["region_link"] as unknown as [string, string_],
        ["place"] as unknown as [string, string_],
        ["place_qid"] as unknown as [string, string_],
        ["place_point"] as unknown as [string, string_],
        ["place_link"] as unknown as [string, string_],
      ],
      location_search: [
        ["search"] as unknown as ["search", string],
        ["place_qid"] as unknown as ["place_qid", string_],
        ["place"] as unknown as ["place", string_],
        ["region_qid"] as unknown as ["region_qid", string_],
        ["country_qid"] as unknown as ["country_qid", string_],
        ["place_point"] as unknown as ["place_point", string_],
        ["place_link"] as unknown as ["place_link", string_],
        ["region"] as unknown as ["region", string_],
        ["region_shape"] as unknown as ["region_shape", string_],
        ["region_point"] as unknown as ["region_point", string_],
        ["region_link"] as unknown as ["region_link", string_],
        ["country"] as unknown as ["country", string_],
        ["country_shape"] as unknown as ["country_shape", string_],
        ["country_link"] as unknown as ["country_link", string_],
      ],
      instrument: [
        ["i_id", "VARCHAR PRIMARY KEY NOT NULL"] as unknown as ["i_id", i_id_t],
        ["exchange", "VARCHAR NOT NULL"] as unknown as ["exchange", string],
        ["currency", "CHAR(3) NOT NULL"] as unknown as ["currency", string],
        ["ticker", "VARCHAR NOT NULL"] as unknown as ["ticker", string],
        ["saxo_id", "SMALLINT"] as unknown as ["saxo_id", number_],
        ["ibkr_id", "SMALLINT"] as unknown as ["ibkr_id", number_],
      ],
      instrument_meta: [
        ["i_id", "VARCHAR PRIMARY KEY NOT NULL"] as unknown as ["i_id", i_id_t],
        ["description"] as unknown as ["description", string],
        ["about_instrmnt"] as unknown as ["about_instrmnt", string_],
        ["asset_class"] as unknown as ["asset_class", string_],
        ["asset_sector"] as unknown as ["asset_sector", string_],
        ["asset_industry"] as unknown as ["asset_industry", string_],
        ["website"] as unknown as ["website", string_],
        ["isin"] as unknown as [string, string_],
        ["cfi"] as unknown as [string, string_],
        ["svg_logo"] as unknown as [string, string_],
      ],
      instrument_location: [
        ["i_id", "VARCHAR PRIMARY KEY NOT NULL"] as unknown as ["i_id", i_id_t],
        ["country_qid", "VARCHAR"] as unknown as ["country_qid", string_],
        ["place_qid", "VARCHAR"] as unknown as ["place_qid", string_],
        ["region_qid", "VARCHAR"] as unknown as ["region_qid", string_],
      ],
      instrument_country: [
        ["qid", "VARCHAR PRIMARY KEY NOT NULL"] as unknown as ["qid", string],
        ["search", "VARCHAR"] as unknown as ["search", string_],
        ["name", "VARCHAR NOT NULL"] as unknown as ["name", string],
        ["geo_shape", "VARCHAR"] as unknown as ["geo_shape", string_],
        ["wiki_link", "VARCHAR"] as unknown as ["wiki_link", string_],
      ],
      instrument_region: [
        ["qid", "VARCHAR PRIMARY KEY NOT NULL"] as unknown as ["qid", string],
        ["name", "VARCHAR NOT NULL"] as unknown as ["name", string],
        ["geo_shape", "VARCHAR"] as unknown as ["geo_shape", string_],
        ["geo_point", "VARCHAR"] as unknown as ["geo_point", string_],
        ["wiki_link", "VARCHAR"] as unknown as ["wiki_link", string_],
      ],
      instrument_place: [
        ["qid", "VARCHAR PRIMARY KEY NOT NULL"] as unknown as ["qid", string],
        ["search", "VARCHAR NOT NULL"] as unknown as ["search", string],
        ["name", "VARCHAR NOT NULL"] as unknown as ["name", string],
        ["geo_point", "VARCHAR"] as unknown as ["geo_point", string_],
        ["wiki_link", "VARCHAR"] as unknown as ["wiki_link", string_],
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
  static get views() {
    const pf = "instrument";
    return {
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
      ${pf}_meta.cfi,
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
}

declare global {
  namespace db {
    type tables_t = (typeof Tables)["tables"];
    type views_t = (typeof Tables)["views"];
    type view_n = keyof views_t;
    type table_n = keyof tables_t;
    type table_t<T extends table_n> = tables_t[T];
    type col_n<T extends table_n> = (tables_t[T] &
      readonly (readonly [string, string?])[])[number][0];
    type condition_t<T extends table_n> = [col_n<T>, string | number | boolean];
    type sort_t<T extends table_n> = [col_n<T>, "ASC" | "DESC"];
    type ignore_t<T extends table_n> = col_n<T>[];

    type data_t<T extends table_n> = {
      [K in table_t<T>[number][0]]: Extract<table_t<T>[number], [K, any]>[1];
    };
  }
}
type number_ = number | undefined;
type string_ = string | undefined;
