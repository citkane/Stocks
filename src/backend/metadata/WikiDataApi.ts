import Fetch, { LibCallback, type fm } from "@common/FetchManager";
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

export class WikiDataApi {
  constructor() {
    this.fetch = new Fetch<"req">(...this.fetcher.constructor()).fetch;
  }
  public fetch: InstanceType<typeof Fetch>["fetch"];

  public request = {
    vars: (...vars: wd.geo_key_t[]) => {
      logger.debug("sparql", vars);
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
    //    place: async (country_qid: string, place_qid: string) => {
    //      const vars = this.request.vars("place", "placeLabel", "placePoint");
    //      const query = encodeURIComponent(sparql());
    //      const url = `${api.query}?query=${query}`;
    //      const headers = this.wiki.headers_sparql();
    //      return new Request(url, { headers });
    //
    //      function sparql() {
    //        return `SELECT DISTINCT ${vars} WHERE {
    //  BIND(wd:${place_qid} AS ?place)
    //  BIND(wd:${country_qid} AS ?country)
    //
    //  OPTIONAL { ?place wdt:P625 ?placePoint. }
    //  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    //}
    //LIMIT 1`;
    //      }
    //    },
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
  private place_statement = this.wiki.place_statement_init();
}

export namespace wd {
  export type query_t<K extends geo_key_t = geo_key_t> = {
    head: {
      vars: string[];
    };
    results: {
      bindings: geo_val_t<K>[];
    };
  };
  export type geo_t = { [key in geo_key_t]: string | undefined };

  export type search_t = {
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
  export type geo_key_t =
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

  export type convert_key_t = "country" | "region" | "place";
}

type geo_val_t<K extends wd.geo_key_t = wd.geo_key_t> = {
  [key in K]: {
    type: string;
    value: string;
    datatype?: string;
    "xml:lang"?: string;
  };
};
