//const char = {
//  prim: def("VARCHAR PRIMARY KEY"),
//  char: "VARCHAR",
//  def: def(char.char),
//};
//const dec = {
//  "5": "DECIMAL(38,5)",
//  "2": "DECIMAL(38,2)",
//  "2_def": def("DECIMAL(38,2)"),
//};

function dec(precision: number, scale: number) {
  return `DECIMAL(${precision},${scale})`;
}
function def(decl: string) {
  return `${decl} NOT NULL`;
}
function prim(decl: string) {
  return `${decl} ${def("PRIMARY KEY")}`;
}
function char(len?: number) {
  return len ? `CHAR(${len})` : "VARCHAR";
}

const view_qid_map = [
  ["geo_map", null, "j"] as unknown as [
    "geo_map",
    {
      [qid: string]: {
        name: string;
        wiki_link: string;
        geo_point?: g.geo_point;
        geo_shape?: Object;
      };
    },
  ],
] as const;
const view_locatns = [
  ["plc_search", null, "j"] as unknown as ["plc_search", string[]],
  ["cntry_search", null, "j"] as unknown as ["cntry_search", string[]],
  ["place_qid"] as unknown as ["place_qid", string],
  ["place"] as unknown as ["place", string],
  ["region_qid"] as unknown as ["region_qid", string | null],
  ["country_qid"] as unknown as ["country_qid", string | null],
  ["place_point", null, "j"] as unknown as ["place_point", g.geo_point | null],
  ["place_link"] as unknown as ["place_link", string | null],
  ["region"] as unknown as ["region", string | null],
  ["region_shape"] as unknown as ["region_shape", string | null],
  ["region_point", null, "j"] as unknown as [
    "region_point",
    g.geo_point | null,
  ],
  ["region_link"] as unknown as ["region_link", string | null],
  ["country"] as unknown as ["country", string | null],
  ["country_shape"] as unknown as ["country_shape", string | null],
  ["country_link"] as unknown as ["country_link", string | null],
] as const;
const view_instrmnt_meta = [
  ["p_id"] as unknown as ["p_id", id.p],
  ["ticker"] as unknown as ["ticker", string],
  ["exchange"] as unknown as ["exchange", string],
  ["currency"] as unknown as ["currency", string],
  ["asset_class"] as unknown as ["asset_class", string],
  ["description"] as unknown as ["description", string],
  ["about_instrmnt"] as unknown as ["about_instrmnt", string | null],
  ["asset_sector"] as unknown as ["asset_sector", string | null],
  ["asset_industry"] as unknown as ["asset_industry", string | null],
  ["website"] as unknown as ["website", string | null],
  ["isin"] as unknown as ["isin", string | null],
  ["svg_logo"] as unknown as ["svg_logo", string | null],
  ["tv_link"] as unknown as ["tv_link", string | null],
  ["geo", undefined, "j"] as unknown as ["geo", g.meta_geo],
] as const;
const view_transctns = [
  ["id"] as unknown as ["id", string],
  ["a_id"] as unknown as ["a_id", string],
  ["p_id"] as unknown as ["p_id", id.i],
  ["i_id"] as unknown as ["i_id", id.i],
  ["broker"] as unknown as ["broker", g.broker],
  ["currency"] as unknown as ["currency", string],
  ["amount"] as unknown as ["amount", number],
  ["traded_fx"] as unknown as ["traded_fx", number],
  ["traded_price"] as unknown as ["traded_price", number],
  ["date"] as unknown as ["date", number],
  ["kind"] as unknown as ["kind", lv.transctn_kind],
] as const;
const accounts = [
  ["a_id", prim(char())] as unknown as ["a_id", id.a],
  ["broker", def(char(3))] as unknown as ["broker", g.broker],
  ["currency", def(char(3))] as unknown as ["currency", string],
  ["alias", char()] as unknown as ["alias", string | null],
  ["broker_key", char()] as unknown as ["broker_key", string | null],
] as const;
const transactions = [
  ["id", prim(char())] as unknown as ["id", string],
  ["a_id", def(char())] as unknown as ["a_id", string],
  ["i_id", def(char())] as unknown as ["i_id", id.i],
  ["broker", def(char(4))] as unknown as ["broker", g.broker],
  ["currency", def(char(3))] as unknown as ["currency", string],
  ["amount", "SMALLINT"] as unknown as ["amount", number],
  ["traded_fx", dec(38, 5)] as unknown as ["traded_fx", number],
  ["traded_price", dec(35, 2)] as unknown as ["traded_price", number],
  ["date", def("DATETIME")] as unknown as ["date", number],
  ["kind", def(char(6))] as unknown as ["kind", lv.transctn_kind],
] as const;
const instrmnt = [
  ["i_id", prim(char())] as unknown as ["i_id", id.i],
  ["exchange", def(char())] as unknown as ["exchange", string],
  ["currency", def(char(3))] as unknown as ["currency", string],
  ["ticker", def(char())] as unknown as ["ticker", string],
  ["description", def(char())] as unknown as ["description", string],
  ["asset_class", def(char())] as unknown as ["asset_class", string],
  ["saxo_id", "SMALLINT"] as unknown as ["saxo_id", number | null],
  ["ibkr_id", "SMALLINT"] as unknown as ["ibkr_id", number | null],
] as const;
const id_join = [
  ["i_id", prim(char())] as unknown as ["i_id", id.i],
  ["p_id", def(char())] as unknown as ["p_id", id.p],
] as const;
const instrmnt_meta = [
  ["p_id", prim(char())] as unknown as ["p_id", id.p],
  ["ticker", def(char())] as unknown as ["ticker", string],
  ["exchange", def(char())] as unknown as ["exchange", string],
  ["currency", def(char(3))] as unknown as ["currency", string],
  ["asset_class", def(char())] as unknown as ["asset_class", string],
  ["description", def(char())] as unknown as ["description", string],
  ["about_instrmnt", char()] as unknown as ["about_instrmnt", string | null],
  ["asset_sector", char()] as unknown as ["asset_sector", string | null],
  ["asset_industry", char()] as unknown as ["asset_industry", string | null],
  ["website", char()] as unknown as ["website", string | null],
  ["isin", char()] as unknown as ["isin", string | null],
  ["svg_logo", char()] as unknown as ["svg_logo", string | null],
  ["tv_link", char()] as unknown as ["tv_link", string | null],
  ["place", char()] as unknown as ["place", string | null],
  ["country", char()] as unknown as ["country", string | null],
] as const;
const meta_location = [
  ["p_id", prim(char())] as unknown as ["p_id", id.p],
  ["country_qid", char()] as unknown as ["country_qid", string | null],
  ["place_qid", char()] as unknown as ["place_qid", string | null],
  ["region_qid", char()] as unknown as ["region_qid", string | null],
] as const;
const geo_country = [
  ["qid", prim(char())] as unknown as ["qid", string],
  ["search", def("TEXT"), "j"] as unknown as ["search", string[]],
  ["name", def(char())] as unknown as ["name", string],
  ["geo_shape", "TEXT", "j"] as unknown as ["geo_shape", Object | null],
  ["wiki_link", char()] as unknown as ["wiki_link", string | null],
] as const;
const geo_region = [
  ["qid", prim(char())] as unknown as ["qid", string],
  ["name", def(char())] as unknown as ["name", string],
  ["country_qid", def(char())] as unknown as ["country_qid", string],
  ["geo_shape", "TEXT", "j"] as unknown as ["geo_shape", Object | null],
  ["geo_point", "TEXT", "j"] as unknown as ["geo_point", g.geo_point | null],
  ["wiki_link", char()] as unknown as ["wiki_link", string | null],
] as const;
const geo_place = [
  ["qid", prim(char())] as unknown as ["qid", string],
  ["region_qid", def(char())] as unknown as ["region_qid", string],
  ["country_qid", def(char())] as unknown as ["country_qid", string],
  ["search", def("TEXT"), "j"] as unknown as ["search", string[]],
  ["name", def(char())] as unknown as ["name", string],
  ["geo_point", "TEXT", "j"] as unknown as ["geo_point", g.geo_point | null],
  ["wiki_link", char()] as unknown as ["wiki_link", string | null],
] as const;
const live_chart = [
  ["time", prim("DATETIME")] as unknown as ["time", number],
  ["open", def("NUMERIC")] as unknown as ["open", number],
  ["close", def("NUMERIC")] as unknown as ["close", number],
  ["high", def("NUMERIC")] as unknown as ["high", number],
  ["low", def("NUMERIC")] as unknown as ["low", number],
  ["volume", def("NUMERIC")] as unknown as ["volume", number],
] as const;
const live_forex = [
  ["currency", prim(char())] as unknown as ["currency", string],
  ["exchange", def(char())] as unknown as ["exchange", string],
  ["open", def(dec(38, 5))] as unknown as ["open", number],
  ["close", def(dec(38, 5))] as unknown as ["close", number],
] as const;
const live_instrmnt = [
  ["p_id", prim(char())] as unknown as ["p_id", id.p],
  ["exchange", def(char())] as unknown as ["exchange", string],
  ["current_session", def(char())] as unknown as [
    "current_session",
    tv.fields.session,
  ],
  ["currency", def(char(3))] as unknown as ["currency", string],
  ["dividends_yield", dec(38, 5)] as unknown as [
    "dividends_yield",
    number | null,
  ],
  ["open", def(dec(35, 2))] as unknown as ["open", number],
  ["close", def(dec(35, 2))] as unknown as ["close", number],
  ["high", def(dec(35, 2))] as unknown as ["high", number],
  ["low", def(dec(35, 2))] as unknown as ["low", number],
  ["type", char()] as unknown as ["type", string | null],
] as const;
const live_balances = [
  ["a_id", prim(char())] as unknown as ["a_id", id.a],
  ["currency", def(char())] as unknown as ["currency", string],
  ["assets_val", def(dec(35, 2))] as unknown as ["assets_val", number],
  ["cash", def(dec(35, 2))] as unknown as ["cash", number],
] as const;

const tables = Object.freeze({
  view_locatns,
  view_qid_map,
  view_instrmnt_meta,
  view_transctns,
  accounts,
  transactions,
  instrmnt,
  id_join,
  instrmnt_meta,
  meta_location,
  geo_country,
  geo_region,
  geo_place,
  live_chart,
  live_forex,
  live_instrmnt,
  live_balances,
} as const);
const views = {
  view_instrmnt_meta: `
CREATE VIEW IF NOT EXISTS view_instrmnt_meta
AS
SELECT DISTINCT
      instrmnt_meta.p_id,
      instrmnt_meta.ticker,
      instrmnt_meta.exchange,
      instrmnt_meta.currency,
      instrmnt_meta.asset_class,
      instrmnt_meta.description,
      instrmnt_meta.about_instrmnt,
      instrmnt_meta.asset_sector,
      instrmnt_meta.asset_industry,
      instrmnt_meta.website,
      instrmnt_meta.isin,
      instrmnt_meta.svg_logo,
      instrmnt_meta.tv_link,
      json_object(
        'country_qid', meta_location.country_qid,
        'region_qid', meta_location.region_qid,
        'place_qid', meta_location.place_qid
      ) AS geo
FROM
      instrmnt_meta
LEFT JOIN meta_location ON meta_location.p_id = instrmnt_meta.p_id;`,
  view_transctns: `
CREATE VIEW IF NOT EXISTS view_transctns
AS
SELECT DISTINCT
    transactions.id,
    transactions.a_id,
    transactions.i_id,
    id_join.p_id,
    transactions.broker,
    transactions.currency,
    transactions.amount,
    transactions.traded_fx,
    transactions.traded_price,
    transactions.date,
    transactions.kind
FROM
    transactions
LEFT JOIN id_join ON id_join.i_id = transactions.i_id;`,
  view_locatns: `
CREATE VIEW IF NOT EXISTS view_locatns
AS
SELECT DISTINCT
    geo_place.search AS plc_search,
    geo_place.qid AS place_qid,
    geo_place.name AS place,
    geo_place.geo_point AS place_point,
    geo_place.wiki_link AS place_link,
    geo_region.qid AS region_qid,
    geo_region.name AS region,
    geo_region.geo_shape AS region_shape,
    geo_region.geo_point AS region_point,
    geo_region.wiki_link AS region_link,
    geo_country.qid AS country_qid,
    geo_country.search AS cntry_search,
    geo_country.name AS country,
    geo_country.geo_shape AS country_shape,
    geo_country.wiki_link as country_link
FROM
      meta_location
LEFT JOIN geo_place ON geo_place.qid = meta_location.place_qid
LEFT JOIN geo_region ON geo_region.qid = meta_location.region_qid
LEFT JOIN geo_country ON geo_country.qid = meta_location.country_qid;`,
  view_qid_map: `
CREATE VIEW IF NOT EXISTS view_qid_map
AS
WITH 
json AS (
	SELECT
		json_group_object(
			geo_country.qid, json_object(
				'name', geo_country.name,
				'wiki_link', geo_country.wiki_link
			)
		) AS countries,
		json_group_object(
			geo_region.qid, json_object(
				'name', geo_region.name,
				'wiki_link', geo_region.wiki_link,
				'geo_point', json(geo_region.geo_point)
			)
		) AS regions,
		json_group_object(
			geo_place.qid, json_object(
				'name', geo_place.name,
				'wiki_link', geo_place.wiki_link,
				'geo_point', json(geo_region.geo_point)
			)	
		) AS places
	FROM geo_country, geo_region, geo_place
),
geo AS (
	SELECT
		json_patch(json.regions, json.countries) AS country_regions,
		json.places AS places
	FROM json
)
SELECT json_patch(geo.country_regions, geo.places) AS geo_map
FROM geo;`,
  view_geo_shapes: `
CREATE VIEW IF NOT EXISTS view_geo_shapes
AS
SELECT
	geo_country.qid,
	json(geo_country.geo_shape) AS geo_shape
FROM geo_country
UNION
SELECT
	geo_region.qid,
	json(geo_region.geo_shape) AS  geo_shape
FROM geo_region;
`,
};

export class Tables {
  static get views() {
    const { view_instrmnt_meta, view_locatns, view_qid_map, view_transctns } =
      views;
    return {
      view_instrmnt_meta: (() => view_instrmnt_meta.trim())(),
      view_locatns: (() => view_locatns.trim())(),
      view_qid_map: (() => view_qid_map.trim())(),
      view_transctns: (() => view_transctns.trim())(),
    } as const;
  }
  static get table_names() {
    return Object.keys(tables);
  }
  static get view_names() {
    return Object.keys(this.views);
  }
  static json_tables = Object.entries(tables).reduce(
    (json_tables, entry) => {
      const [table_name, cols] = entry as [db.tbl.names, readonly string[][]];
      const json_cols = cols.filter((row) => row[2] === "j");
      if (!json_cols.length) return json_tables;

      (json_tables as any)[table_name] = json_cols.reduce(
        (rows, row) => {
          const name = row[0]!;
          rows[name] = row[2] === "j";
          return rows;
        },
        {} as { [key: string]: boolean },
      );

      return json_tables;
    },
    {} as { [K in db.tbl.names]: { [T in db.tbl.col_names<K>]: boolean } },
  );
  static tables = Object.entries(tables).reduce(
    (tables, entry) => {
      const [table_name, cols] = entry as [db.tbl.names, readonly string[][]];
      (tables as any)[table_name] = cols.reduce(
        (rows, row) => {
          const name = row[0]!;
          rows[name] = true;
          return rows;
        },
        {} as { [key: string]: true },
      );
      return tables;
    },
    {} as { [K in db.tbl.names]: { [T in db.tbl.col_names<K>]: true } },
  );
  static primary_cols = Object.entries(tables).reduce(
    (tables, entry) => {
      const [table_name, rows] = entry as [db.tbl.names, readonly string[][]];
      const primary_row = rows.find(
        (row) => row[1] && row[1].includes("PRIMARY KEY"),
      );
      tables[table_name] = primary_row ? primary_row[0] : undefined;
      return tables;
    },
    {} as { [key in db.tbl.names]: string | undefined },
  );
  static schema = <T extends db.tbl.names>(table_name: T) => {
    const table_rows = (tables as p.tables)[table_name]!;
    return table_rows.map((col) => `'${col[0]}' ${col[1]}`).join(", ");
  };
}

declare global {
  namespace db {
    namespace tbl {
      type names = p.table_names;
      type names_json = p.json_table_names;
      type cols<T extends names> = p.table_cols<T>;
      type col_names<T extends tbl.names> = p.table_col_names<T>;
    }
    type data<
      T extends tbl.names,
      Ex extends p.table_col_names<T> | "" = "",
    > = p.data<T, Ex>;
    type condition<T extends tbl.names> = p.condition<T>;
    type sort<T extends tbl.names> = [tbl.col_names<T>, "ASC" | "DESC"];

    type res_type<T extends db.tbl.names, C extends string> = db.data<
      T,
      Exclude<db.tbl.col_names<T>, C>
    >;
  }
}

/** Private types */
namespace p {
  export type table_cols<T extends table_names> = tables[T];
  export type table_names = keyof tables;
  export type table_col_names<T extends table_names> = table_cols<T>[number][0];
  export type json_table_names = keyof json_tables;
  export type condition<T extends table_names> = [
    table_col_names<T>,
    string | number | boolean,
  ];
  export type tables = typeof tables;

  export type data<
    T extends table_names,
    Ex extends table_col_names<T> | "" = "",
  > = to_data<tables[T], Ex>;

  export type to_data<
    Tb extends readonly [string, any][],
    Ex extends string = "",
  > = (keys_req<Tb> extends infer R extends readonly [Tb[number][0], any][]
    ? {
        [K in R[number] as K[0] extends Ex ? never : K[0]]: K[1];
      }
    : {}) &
    (keys_opt<Tb> extends infer R extends readonly [Tb[number][0], any][]
      ? {
          [K in R[number] as K[0] extends Ex ? never : K[0]]?: K[1];
        }
      : {});

  type keys_req<T extends readonly [string, any][]> = T extends readonly [
    [infer K extends string, infer V],
    ...infer R extends readonly [string, any][],
  ]
    ? null extends V
      ? keys_req<R>
      : [[K, V], ...flatten<keys_req<R>>]
    : [];
  type keys_opt<T extends readonly [string, any][]> = T extends readonly [
    [infer K extends string, infer V],
    ...infer R extends readonly [string, any][],
  ]
    ? null extends V
      ? [[K, Exclude<V, null>], ...flatten<keys_opt<R>>]
      : keys_opt<R>
    : [];

  type flatten<T> = T extends [infer F, ...infer R]
    ? [F, ...(R extends any[] ? flatten<R> : [])]
    : [];

  type json_col_names<T extends table_names> = keyof json_cols<T>;
  type json_tables = {
    [K in keyof tables as json_col_names<K> extends never
      ? never
      : K]: tables[K];
  };
  type json_cols<T extends table_names> = {
    [K in table_cols<T>[number] as K[2] extends "j" ? K[0] : never]: K;
  } & {
    [K in table_cols<T>[number] as K[3] extends "j" ? K[0] : never]: K;
  };
}
