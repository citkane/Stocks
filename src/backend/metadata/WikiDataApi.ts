import Fetch, { LibCallback } from "@common/FetchManager";
import { Global } from "@backend/Global";

const lib_cb = new LibCallback<"req">();
const req_per_min_max = 200,
  concurrency_max = 3,
  u_agent =
    "Stocks/0.0 (https://github.com/citkane/Stocks/; noop@openpoint.ie)",
  api = {
    api: "https://www.wikidata.org/w/api.php",
    query: "https://query.wikidata.org/sparql",
    links: "https://www.wikidata.org/wiki/Special:EntityData",
    commons: "https://commons.wikimedia.org/w/index.php",
  };

export class WikiDataApi extends Global {
  constructor() {
    super();
    this.fetch = new Fetch<"req">(...this.fetcher.constructor()).fetch;
  }
  public fetch: InstanceType<typeof Fetch>["fetch"];

  public request = {
    vars: (...vars: p.geo_key[]) => {
      return vars.map((v) => `?${v}`).join(" ");
    },
    country: async (place_qid: string) => {
      const vars = this.request.vars("country", "countryLabel", "countryShape");
      const query = encodeURIComponent(sparql());
      const url = `${api.query}?query=${query}`;
      const headers = this.wiki.headers_sparql();
      return new Request(url, { headers });

      function sparql() {
        return `SELECT DISTINCT ${vars} WHERE {
  BIND(wd:${place_qid} AS ?place)
  ?place (wdt:P131+) ?country.
  ?country wdt:P31 wd:Q6256.
  OPTIONAL { ?country wdt:P3896 ?countryShape. }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
LIMIT 1`;
      }
    },
    place_region: async (place_qid: string, country_qid: string) => {
      const vars = this.request.vars(
        "region",
        "regionLabel",
        "regionPoint",
        "regionShape",
        "place",
        "placeLabel",
        "placePoint",
      );
      const query = encodeURIComponent(sparql());
      const url = `${api.query}?query=${query}`;
      const headers = this.wiki.headers_sparql();
      return new Request(url, { headers });

      function sparql() {
        return `SELECT DISTINCT ${vars} WHERE {
  BIND(wd:${country_qid} AS ?country)
  BIND(wd:${place_qid} AS ?place)
  OPTIONAL {
    ?place (wdt:P131+) ?region.
    ?region wdt:P131 ?country.
  }
  BIND(IF(BOUND(?region), ?region, ?place) AS ?region)
  OPTIONAL { ?region wdt:P625 ?regionPoint. }
  OPTIONAL { ?region wdt:P3896 ?regionShape. }
  OPTIONAL { ?place wdt:P625 ?placePoint. }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
LIMIT 1`;
      }
    },
    search: async (
      term: string,
      _statements: string[] = [],
      limit: number = 5,
    ) => {
      const headers = this.wiki.headers();
      const url = new URL(api.api);
      url.search = params();
      return new Request(url, { headers });

      function params() {
        const statements = _statements
          .map((s) => `haswbstatement:${s}`)
          .join(" ");
        return new URLSearchParams({
          action: "query",
          list: "search",
          format: "json",
          srlimit: String(limit),
          srsearch: `${term} ${statements}`,
        }).toString();
      }
    },
    wiki_links: (...q_ids: string[]) => {
      const headers = this.wiki.headers();
      const url = `${api.api}/?action=wbgetentities&ids=${q_ids.join("|")}&format=json&props=sitelinks/urls`;
      return new Request(url, { headers });
    },
    geo_shape: (url: string) => {
      const headers = this.wiki.headers();
      url = url.replaceAll("+", " ");
      return new Request(url, { headers });
    },
  };
  public wiki = {
    places: {
      city_mega: "Q174844",
      city_million: "Q1637706",
      city_large: "Q129676344",
      city_big: "Q1549591",
      city_average: "Q896881",
      city_county: "Q1070990",
      small_city: "Q18466176",
      city: "Q515",
      town: "Q3957",
      village_large: "Q26714626",
      village: "Q532",
      hamlet: "Q5084",
      settlement: "Q486972",
      settlement_rural: "Q129676371",
    },
    statement: {
      is_region: () => `${this.wiki._is_a}=${this.wiki._country}`,
      is_country: () => `${this.wiki._is_a}=${this.wiki._country}`,
      in_country: (country_qid: string) =>
        `${this.wiki._in_country}=${country_qid}`,
      is_place: () => this.place_statement,
    },
    _country: "Q3624078",
    _country_region: "Q10864048",
    _in_country: "P17",
    _is_a: "P31",
    place_statement_init: () => {
      const places = Object.values(this.wiki.places);
      return places.map((place) => `${this.wiki._is_a}=${place}`).join("|");
    },
    headers: (...header: { [key: string]: string }[]) => {
      const collector = {
        "User-Agent": u_agent,
      };
      return header.reduce((c, header) => {
        c = { ...c, ...header };
        return c;
      }, collector);
    },
    headers_sparql: (...header: { [key: string]: string }[]) => {
      return this.wiki.headers(...header, {
        Accept: "application/sparql-results+json",
      });
    },
  };
  private fetcher = {
    retry_cb: lib_cb.retry.generic_factory(),
    timeout_cb: lib_cb.timeout.response_factory(
      "retry-after",
      (time: string | null | Error) => {
        if (time instanceof Error) throw time;
        if (!time) return 1000;
        if (!Number.isNaN(Number(time))) return Number(time) * 1000;

        const now = new Date().valueOf();
        const when = new Date(time).valueOf();
        return when - now;
      },
    ),
    response_cb: lib_cb.response.generic,
    trace_cb: lib_cb.trace.generic,
    hosts: () => [
      ...new Set(Object.values(api).map((url) => new URL(url).hostname)),
    ],
    constructor: () => {
      const { retry_cb, timeout_cb, response_cb } = this.fetcher;
      return [
        req_per_min_max,
        concurrency_max,
        "min",
        this.fetcher.hosts(),
        { retry_cb, timeout_cb, response_cb },
      ] as const;
    },
  };
  protected frmt = {
    query_res: (res: p.res.query) => {
      const data = res.results.bindings[0];
      let geo = {} as p.raw_geo;
      if (!data) return geo;

      geo = (Object.keys(data) as p.geo_key[]).reduce((geo, key) => {
        let val: string | undefined = data[key].value;
        if (["country", "place", "region"].includes(key)) {
          val = val?.split("/").pop()!;
        }
        if (["placePoint", "regionPoint"].includes(key)) {
          const regex = /Point\(([\d|\-.]+)\s+([\d|\-.]+)\)/;
          const matches = val?.match(regex);
          val = matches ? `[${matches[1]}, ${matches[2]}]` : undefined;
        }
        geo[key] = val;
        return geo;
      }, geo);

      return Object.fromEntries(
        Object.entries(geo).filter(([_k, v]) => v && v !== null),
      ) as p.raw_geo;
    },
    links_res: (links: p.res.links, q_id: string) => {
      return links.entities[q_id]!.sitelinks.enwiki.url;
    },
    geo_to_db: <K extends p.ctx>(
      ctx: K,
      geo: g.meta_geo,
      search?: string,
    ): db.data<p.db_tbl> => {
      const db_data = {
        qid: geo[`${ctx}_qid`],
        name: geo[ctx],
        wiki_link: geo[`${ctx}_link`],
      } as db.data<p.db_tbl>;

      if (["country", "place"].includes(ctx)) {
        (db_data as db.data<p.db_tbl<"country" | "place">>).search = search
          ? [search]
          : [];
      }
      if (["country", "region"].includes(ctx)) {
        (db_data as db.data<p.db_tbl<"country" | "region">>).geo_shape =
          geo[`${ctx as "country" | "region"}_shape`];
      }
      if (["place", "region"].includes(ctx)) {
        (db_data as db.data<p.db_tbl<"place" | "region">>).geo_point =
          geo[`${ctx as "place" | "region"}_point`];
        (db_data as db.data<p.db_tbl<"place" | "region">>).country_qid =
          geo.country_qid!;
      }
      if (ctx === "place") {
        (db_data as db.data<p.db_tbl<"place">>).region_qid = geo.region_qid!;
      }

      return db_data;
    },
    merge_geo: (...geo: (g.meta_geo | undefined)[]) => {
      let geo_merged: g.meta_geo = {};
      geo.forEach((geo) => {
        if (!geo) return;
        geo_merged = { ...geo_merged, ...geo };
      });
      return geo_merged;
    },
    prune_geo: (geo: db.data<"view_locatns"> | g.meta_geo, ctx?: p.ctx) => {
      return Object.fromEntries(
        Object.entries(geo).filter(([k, v]) => {
          if (!v || v === null || k === "search") return false;
          return ctx ? k.includes(ctx) : true;
        }),
      ) as g.meta_geo;
    },
    def_array: <T>(a: (T | undefined | null)[]) => {
      a = a.filter((v) => v !== undefined && v !== null);
      return [...new Set(a)] as T[];
    },
  };
  private place_statement = this.wiki.place_statement_init();
  protected cache = {
    resolve: (
      meta: g.meta,
      geo?: g.meta_geo,
      search: p.search = { p_srchd: [], c_srchd: [] },
    ): wd.result => {
      const { frmt, cache } = this;
      const { p_id } = meta;
      if (!geo)
        return {
          locatn: {
            p_id,
            country_qid: undefined,
            region_qid: undefined,
            place_qid: undefined,
          },
          place: undefined,
          region: undefined,
          country: undefined,
        };

      cache.set.all(geo, search);
      const { country_qid, region_qid, place_qid } = geo;
      const locatn: db.data<"meta_location"> = {
        p_id,
        country_qid,
        region_qid,
        place_qid,
      };
      let { p_srchd, c_srchd } = search;
      c_srchd = c_srchd || [];

      return {
        locatn,
        place: frmt.geo_to_db("place", geo, ...p_srchd),
        region: frmt.geo_to_db("region", geo),
        country: frmt.geo_to_db("country", geo, ...c_srchd),
      };
    },
    locatn_search: (geo: g.meta_geo, search?: p.search) => {
      const p_srchd = search?.p_srchd || [],
        c_srchd = search?.c_srchd || [],
        { mem, frmt } = this,
        { place, place_qid, country, country_qid, region_qid } = geo,
        p_keys = frmt.def_array([place_qid, place, ...p_srchd]),
        p_key = p_keys.find((key) => mem.place[key]);
      if (p_key) geo = frmt.merge_geo(geo, mem.place[p_key]!);

      let c_keys = [country_qid, ...p_keys, country, ...c_srchd];
      c_keys = frmt.def_array(c_keys);
      const c_key = c_keys.find((key) => mem.country[key!]);
      if (c_key) geo = frmt.merge_geo(geo, mem.country[c_key]!);

      const r_keys = frmt.def_array([region_qid, ...p_keys]),
        r_key = r_keys.find((key) => mem.region[key]);
      if (r_key) geo = frmt.merge_geo(geo, mem.region[r_key]!);

      return geo;
    },
    set: {
      all: (geo: g.meta_geo, search: p.search) => {
        const { cache } = this;
        let { p_srchd, c_srchd } = search;
        p_srchd = p_srchd || [];
        c_srchd = c_srchd || [];

        cache.set.place(geo, ...p_srchd);
        cache.set.country(geo, ...c_srchd, ...p_srchd);
        cache.set.region(geo, ...p_srchd);
      },
      place: (geo: g.meta_geo, ...search: (string | undefined)[]) => {
        const { frmt } = this;
        const { place, place_qid } = geo;
        const keys = frmt.def_array([place, place_qid, ...search]);
        geo = frmt.prune_geo(geo);
        keys.forEach((key) => (this.mem.place[key] = geo));
      },
      region: (geo: g.meta_geo, ...search: (string | undefined)[]) => {
        const { frmt } = this;
        const { place, place_qid, region_qid, country, country_qid } = geo;
        let keys = [place, place_qid, region_qid];
        keys = frmt.def_array([...keys, country, country_qid, ...search]);
        geo = frmt.prune_geo(geo, "region");
        keys.forEach((key) => (this.mem.region[key!] = geo));
      },
      country: (geo: g.meta_geo, ...search: (string | undefined)[]) => {
        const { frmt } = this;
        const { country, country_qid, place, place_qid, region_qid } = geo;
        let keys = [country, country_qid, place];
        keys = frmt.def_array([...keys, place_qid, region_qid, ...search]);
        geo = frmt.prune_geo(geo, "country");
        keys.forEach((key) => (this.mem.country[key!] = geo));
      },
    },
    init: async () => {
      if (WikiDataApi.cached) return WikiDataApi.cached;
      const { db, cache } = this;

      WikiDataApi.cached = new Promise(async (resolve, reject) => {
        db.select.geo.locatn_search().then(to_mem).then(resolve).catch(reject);
      });

      return WikiDataApi.cached;

      function to_mem(locatns: db.data<"view_locatns">[]) {
        locatns.forEach(async (locatn) => {
          let { cntry_search: c_srchd, plc_search: p_srchd } = locatn;
          c_srchd = c_srchd || [];
          p_srchd = p_srchd || [];

          cache.set.all(locatn, { p_srchd, c_srchd });
        });
      }
    },
  };
  private get mem() {
    return WikiDataApi.mem;
  }

  private static cached: Promise<void> | undefined = undefined;
  protected static mem: p.mem = {
    place: {},
    region: {},
    country: {},
  };
}

declare global {
  namespace wd {
    type result = {
      locatn: db.data<"meta_location">;
      place?: db.data<"geo_place">;
      region?: db.data<"geo_region">;
      country?: db.data<"geo_country">;
    };
  }
}

export namespace p {
  type tbls = "geo_country" | "geo_place" | "geo_region";

  export type ctx = "country" | "region" | "place";
  export type search = { p_srchd: string[]; c_srchd?: string[] };
  export type db_tbl<K extends p.ctx | null = null> = K extends "country"
    ? "geo_country"
    : K extends "region"
      ? "geo_region"
      : K extends "place"
        ? "geo_place"
        : tbls;

  export type mem = {
    place: { [place: string]: g.meta_geo };
    region: { [region: string]: g.meta_geo };
    country: { [country: string]: g.meta_geo };
  };
  export namespace res {
    export type query = {
      head: {
        vars: string[];
      };
      results: {
        bindings: query_val[];
      };
    };
    export type search = {
      batchcomplete: string;
      continue: {
        sroffset: number;
        continue: string;
      };
      query: {
        searchinfo: {
          totalhits: number;
        };
        search: {
          ns: number;
          title: string;
          pageid: number;
          size: null;
          wordcount: number;
          snippet: string;
          timestamp: string;
        }[];
      };
    };
    export type links = {
      entities: {
        [q_id: string]: {
          type: string;
          id: string;
          sitelinks: {
            [name in "enwiki"]: {
              site: string;
              title: string;
              badges: string[];
              url: string;
            };
          };
        };
      };
      success: number;
    };

    type query_val = {
      [key in p.geo_key]: {
        type: string;
        value: string;
        datatype?: string;
        "xml:lang"?: string;
      };
    };
  }
  export type raw_geo = {
    region?: string;
    country?: string;
    place?: string;
    regionLabel?: string;
    countryLabel?: string;
    placeLabel?: string;
    placePoint?: string;
    regionPoint?: string;
    regionShape?: string;
    countryShape?: string;
  };

  export type geo_key = keyof raw_geo;
}
