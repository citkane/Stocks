import { Global } from "@backend/Global";

const req_per_min = 200;
const search_res_limit = 1;
const u_agent =
  "Stocks/0.0 (https://github.com/citkane/Stocks/; noop@openpoint.ie)";
const api = {
  api: "https://www.wikidata.org/w/api.php",
  query: "https://query.wikidata.org/sparql",
  links: "https://www.wikidata.org/wiki/Special:EntityData",
  commons: "https://commons.wikimedia.org/w/index.php",
};

class WikiFetch extends Global {
  constructor(
    private u_agent: string,
    max_req_per_min = 200,
    req_interval = 10,
    max_concurrent = 3,
  ) {
    super();
    WikiFetch.max_req_per_min = max_req_per_min;
    WikiFetch.max_concurrent = max_concurrent;
    const { dequeue } = WikiFetch;
    setInterval(dequeue, req_interval);
  }
  protected get wiki_fetch() {
    return WikiFetch._wiki_fetch;
  }
  protected wiki_headers = (...header: { [key: string]: string }[]) => {
    const collector = {
      "User-Agent": this.u_agent,
    };
    return header.reduce((c, header) => {
      c = { ...c, ...header };
      return c;
    }, collector);
  };
  protected wiki_headers_sparql = (...header: { [key: string]: string }[]) => {
    return this.wiki_headers(...header, {
      Accept: "application/sparql-results+json",
    });
  };

  private static _wiki_fetch = <T = any>(
    req: Request | string,
    retry = false,
  ): Promise<T> => {
    const req_promise = new Promise<T>((resolve, reject) => {
      const fn = async () => {
        const _req = req instanceof Request ? req.clone() : req;
        const res = await fetch(_req);
        this.concurrent--;
        if (!res.ok) return reject({ res, req });

        req = null as unknown as Request;
        const data = await res.json();
        resolve(data);
      };
      retry ? this.requeue(fn) : this.enqueue(fn);
    }).catch((res_req) => {
      const { res, req } = res_req;
      const { status } = res;
      const retry = status === 429 || status === 503;
      if (retry) return this.retry_after<T>(res, req);
      logger.error(res);
      throw Error(res);
    });

    return req_promise;
  };
  private static retry_after = <T = any>(res: Response, req: Request) => {
    start_interval();
    return this._wiki_fetch<T>(req, true);

    function start_interval() {
      const self = WikiFetch;
      clearInterval(self.retry_timer);
      self.retry_pause = extract_secs(res);
      self.retry_timer = setInterval(() => {
        self.retry_pause = self.retry_pause - 1;
        const rpm = WikiFetch.calc_rpm();
        const { status, statusText } = res;
        logger.warn(
          `WikiData ${status} ${statusText}, wait for: ${self.retry_pause} seconds: rpm = ${rpm}`,
        );
        if (!self.retry_pause) clearInterval(self.retry_timer);
      }, 1000);
    }
    function to_sec(date: string) {
      const now = new Date().valueOf();
      const when = new Date(date).valueOf();
      return Math.ceil((when - now) / 1000);
    }
    function extract_secs(res: Response) {
      let time: string | number | null = res.headers.get("retry-after");
      if (!time) time = "5";
      time = Number.isNaN(Number(time)) ? to_sec(time) : Number(time);
      return time;
    }
  };
  private static dequeue = () => {
    const wait =
      !this.queue.length ||
      this.retry_pause > 0 ||
      this.concurrent >= this.max_concurrent;
    if (wait) return;

    const rpm = this.calc_rpm();
    if (rpm >= this.max_req_per_min) return;

    const now = new Date().valueOf();
    this.rpm_times.push(now);
    const req_fn = this.queue.shift()!;
    if (!req_fn) throw Error("No request function");
    this.concurrent++;
    req_fn();

    logger.debug({
      rpm,
      queue: this.queue.length,
      concurrency: this.concurrent,
    });
  };
  private static enqueue = (fn: Function) => {
    this.queue.push(fn);
  };
  private static requeue = (fn: Function) => {
    this.queue.unshift(fn);
  };
  private static calc_rpm = () => {
    const minute_ago = new Date().valueOf() - 60000;
    this.rpm_times = this.rpm_times.filter((time) => time > minute_ago);
    return this.rpm_times.length;
  };

  private static max_req_per_min: number;
  private static retry_pause = 0;
  private static max_concurrent: number;
  private static concurrent = 0;
  private static queue: Function[] = [];
  private static rpm_times: number[] = [];
  private static retry_timer?: any;
}

export class WikiData extends WikiFetch {
  constructor() {
    super(u_agent, req_per_min);
  }
  protected geo_location = async (
    i_id: i_id_t,
    place_search: string | undefined,
    country_search: string | undefined,
  ) => {
    let qids: b.qids_t = {
      place: undefined,
      region: undefined,
      country: undefined,
    };
    const { insert_location } = this.data;
    if (place_search === "Northlands") place_search = "Illovo";
    if (!place_search) return insert_location(qids, i_id);

    let geo_data = await this.db.select.location_search(place_search);
    if (geo_data) {
      const {
        place_qid: place,
        region_qid: region,
        country_qid: country,
      } = geo_data;
      await insert_location({ place, region, country }, i_id);
      return geo_data;
    }

    qids = await this.find.place_qid(qids, place_search, country_search);
    if (!qids.place) return insert_location(qids, i_id);

    const place = await this.find.place(qids, place_search);
    if (!place) return insert_location(qids, i_id);
    logger.debug("place", place.place);

    const country = await this.find.country(qids, country_search);
    qids.country = country?.country_qid;
    if (!country) return insert_location(qids, i_id);
    logger.debug("country", country.country);

    const region = await this.find.region(qids);
    qids.region = region?.region_qid;
    if (!region) return insert_location(qids, i_id);
    logger.debug("region", region.region);

    await insert_location(qids, i_id);
    return { ...place, ...region, ...country } as geo_data_t;
  };
  private find = {
    place_qid: async (
      qids: b.qids_t,
      place_search: string,
      country_search?: string,
    ) => {
      const { statement: stmnt } = this.wiki;
      qids = await this.find.country_qid(qids, country_search);

      const statements = qids.country
        ? [stmnt.in_country(qids.country), stmnt.is_place()]
        : [stmnt.is_place()];
      qids.place = await this.find.search(place_search, statements);
      return qids;
    },
    country_qid: async (qids: b.qids_t, cntry_search?: string) => {
      const { country_search } = this.db.select;
      const { country_qid_from_place } = this.find;
      if (qids.country) return qids;
      if (!cntry_search && !qids.place) return qids;
      if (!cntry_search) return country_qid_from_place(qids);

      qids.country = (await country_search(cntry_search))?.qid;
      if (qids.country) return qids;

      const { statement: stmnt } = this.wiki;
      const statements = [stmnt.is_country()];
      qids.country = await this.find.search(cntry_search, statements);
      return qids;
    },
    country_qid_from_place: async (qids: b.qids_t) => {
      if (!qids.place) return qids;

      const req = this.req.country(qids.place);
      const data = await this.wiki_fetch<wiki_query_t>(req).then(
        this.data.reduce_query_res,
      );
      qids.country = data.country;
      return qids;
    },
    country: async (qids: b.qids_t, country_search?: string) => {
      let country_db = await this.db.select.country_search(country_search);
      if (country_db) return this.data.db_to_geo("country", country_db);

      qids = await this.find.country_qid(qids, country_search);
      if (!qids.country || !qids.place) return undefined;

      country_db = await this.db.select.country(qids.country);
      if (country_db) {
        if (!country_db.search && country_search) {
          country_db.search = country_search;
          await this.db.update.instrmnts_country(country_db);
        }
        return this.data.db_to_geo("country", country_db);
      }

      const req = this.req.country(qids.place);
      const country_geo = await this.wiki_fetch<wiki_query_t>(req)
        .then(this.data.reduce_query_res)
        .then(this.data.geo);
      country_db = this.data.geo_to_db("country", country_geo, country_search);
      await this.db.insert.instrmnts_country([country_db]);
      return country_geo;
    },
    region: async (qids: b.qids_t) => {
      if (!qids.place || !qids.country) return undefined;

      const req = this.req.region(qids.country, qids.place);
      const wiki_geo = await this.wiki_fetch<wiki_query_t>(req).then(
        this.data.reduce_query_res,
      );
      if (!wiki_geo.region) return undefined;

      let region_db = await this.db.select.region(wiki_geo.region);
      if (region_db) return this.data.db_to_geo("region", region_db);

      const region_geo = await this.data.geo(wiki_geo);
      region_db = this.data.geo_to_db("region", region_geo);

      await this.db.insert.instrmnts_region([region_db]);
      return region_geo;
    },
    place: async (qids: b.qids_t, place_search: string) => {
      if (!qids.place) return undefined;

      const req = this.req.place(qids.place);
      const place_geo = await this.wiki_fetch(req)
        .then(this.data.reduce_query_res)
        .then(this.data.geo);
      const place_db = this.data.geo_to_db("place", place_geo, place_search);
      await this.db.insert.instrmnts_place([place_db]);
      return place_geo;
    },
    search: async (
      search_term: string,
      statements: string[],
      limit = search_res_limit,
    ) => {
      logger.debug({ search_term });
      const req = this.req.search(search_term, statements, limit);
      const result = await this.wiki_fetch<wiki_search_t>(req).then(
        this.data.parse_search_res,
      );
      return result;
    },
    link: async (q_id: string) => {
      logger.debug("wiki link:", q_id);
      const req = this.req.wiki_links(q_id);
      const res = await this.wiki_fetch<wiki_links_t>(req);
      return this.data.parse_links_res(res, q_id);
    },
    geo_shape: async (url: string) => {
      logger.debug("geo shape:", url);
      const req = this.req.geo_shape(url);
      const shape = await this.wiki_fetch<Object>(req).catch((err) => {
        logger.error(err);
        return undefined;
      });
      return shape ? JSON.stringify(shape) : undefined;
    },
  };
  private data = {
    geo: async (wiki_geo: wiki_geo_t): Promise<Partial<geo_data_t>> => {
      let {
        country: country_qid,
        region: region_qid,
        place: place_qid,
        countryLabel: country,
        regionLabel: region,
        placeLabel: place,
        placePoint: place_point,
        regionPoint: region_point,
        countryShape: country_shape,
        regionShape: region_shape,
      } = wiki_geo;
      region_shape = region_shape
        ? await this.find.geo_shape(region_shape)
        : undefined;
      country_shape = country_shape
        ? await this.find.geo_shape(country_shape)
        : undefined;
      const country_link = country_qid
        ? await await this.find.link(country_qid)
        : undefined;
      const region_link = region_qid
        ? await await this.find.link(region_qid)
        : undefined;
      const place_link = place_qid
        ? await await this.find.link(place_qid)
        : undefined;

      const geo_data = {
        place,
        region,
        country,
        place_qid,
        country_qid,
        region_qid,
        place_link,
        region_link,
        country_link,
        place_point,
        region_point,
        country_shape,
        region_shape,
      } as Partial<geo_data_t>;

      return Object.keys(geo_data).reduce((data, key) => {
        const val = geo_data[key as keyof geo_data_t];
        if (!val) return data;
        data[key as keyof geo_data_t] = val;
        return data;
      }, {} as Partial<geo_data_t>);
    },
    reduce_query_res: (res: wiki_query_t) => {
      const geo_data = {} as wiki_geo_t;
      const data = res.results.bindings[0];
      if (!data) return geo_data;

      return (Object.keys(data) as wiki_geo_key_t[]).reduce((c, key) => {
        let val: string | undefined = data[key].value;
        if (["country", "place", "region"].includes(key)) {
          val = val?.split("/").pop()!;
        }
        if (["placePoint", "regionPoint"].includes(key)) {
          const regex = /Point\(([\d|\-.]+)\s+([\d|\-.]+)\)/;
          const matches = val?.match(regex);
          val = matches ? `${matches[1]},${matches[2]}` : undefined;
        }
        c[key] = val;
        return c;
      }, geo_data);
    },
    parse_search_res: (res: wiki_search_t) => {
      return res.query.search[0]?.title || undefined;
    },
    parse_links_res: (links: wiki_links_t, q_id: string) => {
      return links.entities[q_id]!.sitelinks.enwiki.url;
    },
    insert_location: async (qids: b.qids_t, i_id: i_id_t) => {
      const {
        country: country_qid,
        region: region_qid,
        place: place_qid,
      } = qids;
      await this.db.insert.instrmnts_location([
        { i_id, country_qid, region_qid, place_qid },
      ]);
      return undefined;
    },
    db_to_geo: <T extends convert_key_t>(
      location_key: T,
      data: db_to_geo_t<T>,
    ) => {
      const keys = ["name", "qid", "geo_shape", "geo_point", "wiki_link"];
      const geo_data = {} as Partial<geo_data_t>;
      return keys.reduce((geo_data, key) => {
        if (!Object.hasOwn(data, key)) return geo_data;

        const val = data[key as keyof typeof data];
        let geo_key: string | undefined;
        switch (key) {
          case "geo_shape":
            geo_key = `${location_key}_shape`;
            break;
          case "geo_point":
            geo_key = `${location_key}_point`;
            break;
          case "wiki_link":
            geo_key = `${location_key}_link`;
            break;
          case "name":
            geo_key = location_key;
            break;
          case "qid":
            geo_key = `${location_key}_qid`;
            break;
          default:
            geo_key = undefined;
        }
        if (!geo_key) return geo_data;

        (geo_data as any)[geo_key] = val;
        return geo_data;
      }, geo_data);
    },
    geo_to_db: <T extends convert_key_t>(
      location_key: T,
      geo_data: Partial<geo_data_t>,
      search?: string,
    ) => {
      const db_data = {} as db_to_geo_t<T>;
      if (["country", "place"].includes(location_key)) {
        (db_data as any).search = search;
      }
      return Object.keys(geo_data).reduce((db_data, geo_key) => {
        const val = geo_data[geo_key as keyof geo_data_t];
        let key: string | undefined;
        switch (geo_key) {
          case location_key:
            key = "name";
            break;
          case `${location_key}_qid`:
            key = "qid";
            break;
          case `${location_key}_point`:
            key = "geo_point";
            break;
          case `${location_key}_shape`:
            key = "geo_shape";
            break;
          case `${location_key}_link`:
            key = "wiki_link";
            break;
          default:
            key = undefined;
        }
        if (!key) return db_data;
        (db_data as any)[key] = val;
        return db_data;
      }, db_data);
    },
  };
  private req = {
    vars: (...vars: wiki_geo_key_t[]) => {
      logger.debug("sparql", vars);
      return vars.map((v) => `?${v}`).join(" ");
    },
    country: (place_qid: string) => {
      const vars = this.req.vars("country", "countryLabel", "countryShape");
      const query = encodeURIComponent(sparql());
      const url = `${api.query}?query=${query}`;
      const headers = this.wiki_headers_sparql();
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
    region: (country_qid: string, place_qid: string) => {
      const vars = this.req.vars(
        "region",
        "regionLabel",
        "regionPoint",
        "regionShape",
      );
      const query = encodeURIComponent(sparql());
      const url = `${api.query}?query=${query}`;
      const headers = this.wiki_headers_sparql();
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
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
LIMIT 1`;
      }
    },
    place: (place_qid: string) => {
      const vars = this.req.vars("place", "placeLabel", "placePoint");
      const query = encodeURIComponent(sparql());
      const url = `${api.query}?query=${query}`;
      const headers = this.wiki_headers_sparql();
      return new Request(url, { headers });

      function sparql() {
        return `SELECT DISTINCT ${vars} WHERE {
  BIND(wd:${place_qid} AS ?place)
  OPTIONAL { ?place wdt:P625 ?placePoint. }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
LIMIT 1`;
      }
    },
    search: (term: string, _statements: string[] = [], limit: number = 5) => {
      const headers = this.wiki_headers();
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
      const headers = this.wiki_headers();
      const url = `${api.api}/?action=wbgetentities&ids=${q_ids.join("|")}&format=json&props=sitelinks/urls`;
      return new Request(url, { headers });
    },
    geo_shape: (url: string) => {
      const headers = this.wiki_headers();
      url = url.replaceAll("+", " ");
      return new Request(url, { headers });
    },
  };
  private wiki = {
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
      is_place: () => this._place_statement,
    },
    _country: "Q3624078",
    _country_region: "Q10864048",
    _in_country: "P17",
    _is_a: "P31",
  };
  private place_statement_init() {
    const places = Object.values(this.wiki.places);
    return places.map((place) => `${this.wiki._is_a}=${place}`).join("|");
  }
  private _place_statement = this.place_statement_init();
}

type convert_key_t = "country" | "region" | "place";
type db_to_geo_t<T extends convert_key_t> = T extends "place"
  ? db.data_t<"instrument_place">
  : T extends "country"
    ? db.data_t<"instrument_country">
    : T extends "region"
      ? db.data_t<"instrument_region">
      :
          | db.data_t<"instrument_place">
          | db.data_t<"instrument_country">
          | db.data_t<"instrument_region">;

type wiki_links_t = {
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
type wiki_geo_key_t =
  | "region"
  | "country"
  | "place"
  | "regionLabel"
  | "countryLabel"
  | "placeLabel"
  | "placePoint"
  | "regionPoint"
  | "regionShape"
  | "countryShape";

type wiki_query_t<K extends wiki_geo_key_t = wiki_geo_key_t> = {
  head: {
    vars: string[];
  };
  results: {
    bindings: wiki_geo_val_t<K>[];
  };
};
type wiki_geo_val_t<K extends wiki_geo_key_t = wiki_geo_key_t> = {
  [key in K]: {
    type: string;
    value: string;
    datatype?: string;
    "xml:lang"?: string;
  };
};
type wiki_geo_t = { [key in wiki_geo_key_t]: string | undefined };

type wiki_search_t = {
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

declare global {
  namespace b {
    export type qids_t = {
      place: string | undefined;
      region: string | undefined;
      country: string | undefined;
    };
  }
}
