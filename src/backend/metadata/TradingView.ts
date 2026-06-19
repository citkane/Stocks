import Fetch, { LibCallback } from "@common/FetchManager";
import { Tables } from "@backend/database/Tables";

const user_agent = "Stocks/0.0",
  logo_size = 32,
  rpp_max = 500,
  concurrency_max = 20,
  lib_cb = new LibCallback<"req">(),
  asset_class_map = {
    Stock: "stock",
    COMMON: "stock",
    Etf: "fund",
    ETF: "fund",
  } as const;

/** Trading View API interface {@link https://www.tradingview.com} */
export class TradingView {
  public instrmnt_lookup = async (broker_instm: Partial<instrmnt_t>) => {
    const { fetch_asset_html, fetch_svg_string, search } = this;
    const { to_tv_instrmnt, det_from_html, merge_asset_det } = this.format;
    const { append_svg_logo } = this.format;
    const P = Promise.all.bind(Promise);
    Object.freeze(broker_instm);

    return to_tv_instrmnt(broker_instm)
      .then(search)
      .then((instm) => P([instm || broker_instm, fetch_asset_html(instm)]))
      .then(([instm, html]) => P([instm, det_from_html(html)]))
      .then(([instm, det]) => merge_asset_det(instm, det))
      .then((instm) => P([instm, fetch_svg_string(instm)]))
      .then(([instm, svg]) => append_svg_logo(instm, svg))
      .then((instm) => {
        instm = { ...broker_instm, ...instm };
        Object.freeze(instm);
        return instm;
      });
  };
  public forex = (base_currency: string, currencies: string[]) => {
    const { currencies_to_tickers, fx_keys_to_currency } = this.format;
    const exchange = "FX_IDC";
    const tickers = currencies_to_tickers(currencies, base_currency, exchange);
    const kind = "forex";
    const types: [typeof kind] = [kind];
    return this.scanner<"forex">(tickers, types, kind).then(
      fx_keys_to_currency,
    );
  };
  public instrument_data = (instrmnts: instrmnt_t[]) => {
    const { live_data_ticker } = this.format;
    const tickers = instrmnts.map(
      (i) => `${i.exchange}:${i.ticker}`,
    ) as `${string}:${string}`[];
    return this.scanner(tickers, ["stock", "fund"], "global").then(
      live_data_ticker,
    );
  };
  protected scanner = async <T extends p.scanner.kind>(
    tickers: `${string}:${string}`[],
    types: T extends "global" ? p.asset.kind[] : ["forex"],
    kind: T,
  ): Promise<{
    [ticker: string]: tv.scanner.data<T>;
  }> => {
    if (!tickers.length) {
      logger.error(`No tickkers provided to TV scanner: ${types}, ${kind}`);
      return {};
    }

    const { map_scanner_res } = this.format,
      columns = this.fetcher.scanner_keys(kind),
      url = `https://scanner.tradingview.com/${kind}/scan`,
      query = { types },
      symbols = { tickers, query },
      body = JSON.stringify({
        symbols,
        columns,
      });
    return this.fetcher
      .request(url, "POST", {}, "application/json", body)
      .then((req) => this.fetch<p.scanner.res_t>(req))
      .then((res) => map_scanner_res(res, kind));
  };
  private search = async (instm: Partial<instrmnt_t>) => {
    const url = "https://symbol-search.tradingview.com/symbol_search/v3";
    const { ticker, exchange, asset_class, currency } = instm;
    const { search_to_instm, add_i_id } = this.format;
    const { request } = this.fetcher;
    const { fetch } = this;
    const text = ticker!;
    const hl = "true";

    return request(url, "GET", { text, hl })
      .then((req) => fetch<tv.search_t>(req))
      .then((res) => res.symbols.map(purge_result_ems))
      .then((symbols) => symbols.filter(filter_results))
      .then((symbols) => symbols.sort(ranker)[0])
      .then((s) => (s ? search_to_instm(s).then(add_i_id) : add_i_id(instm)))
      .then((res) => ({ ...instm, ...res }));

    function purge_result_ems(result: tv.search_res_t) {
      const keys = Object.keys(result) as (keyof tv.search_res_t)[];
      return keys.reduce((result, key) => {
        if (typeof result[key] === "string")
          (result as any)[key] = purge_val_em(result[key]);
        return result;
      }, result);
    }
    function purge_val_em(val: string) {
      return val.replaceAll("<em>", "").replaceAll("</em>", "").trim();
    }
    function filter_results(result: tv.search_res_t) {
      return (
        result.type === asset_class &&
        is_same_ticker(result.symbol, ticker!) &&
        result.currency_code === currency
      );
    }
    function is_same_ticker(result: string, query: string) {
      if (result === query) return true;
      if (
        (!Number.isNaN(result) && Number.isNaN(query)) ||
        (!Number.isNaN(query) && Number.isNaN(result))
      )
        return false;
      if (Number(result) === Number(query)) return true;
      return false;
    }
    function ranker(a: tv.search_res_t, b: tv.search_res_t) {
      const a_rank = rank(a.exchange, exchange!);
      const b_rank = rank(b.exchange, exchange!);
      return b_rank - a_rank;
      function rank(tv_ex: string, broker_ex: string) {
        const tv = [...new Set(Array.from(tv_ex))];
        const broker = [...new Set(Array.from(broker_ex))];
        const tv_score = tv.filter((letter) => broker.includes(letter)).length;
        const broker_score = broker.filter((letter) =>
          tv.includes(letter),
        ).length;
        return tv_score + broker_score;
      }
    }
  };
  private fetch_asset_html = async (instm?: Partial<instrmnt_t>) => {
    if (!instm) return;
    const url = `https://www.tradingview.com/symbols/${instm.i_id}`;
    const { request, fetch } = this.fetcher;
    const pms = [url, "GET", {}, "application/text"] as const;
    return request(...pms)
      .then((req) => fetch()<string>(req))
      .catch((_err) => undefined);
  };
  private fetch_svg_string = (instm: Partial<instrmnt_t>) => {
    const { request, fetch } = this.fetcher;
    const response_cb = (res: Response) => res.text();
    return !instm.svg_logo
      ? undefined
      : request(instm.svg_logo).then((req) =>
          fetch()<string>(req, { response_cb }),
        );
  };

  private format = {
    to_tv_instrmnt: async (instm: Partial<instrmnt_t>) => {
      let { asset_class, exchange, ticker, currency } = instm as {
        asset_class: p.asset.kind;
        exchange: string;
        ticker: string;
        currency: string;
      };
      const key = asset_class as p.asset.broker_kind;
      if (!asset_class_map[key]) throw `"${key}" is not a mapped asset kind`;

      asset_class = asset_class_map[key];
      exchange = exchange.toUpperCase();
      ticker = ticker.toUpperCase();
      currency = currency === "CNH" ? "CNY" : currency;
      currency = currency === "ZAR" ? "ZAC" : currency;
      if (exchange === "XHKG") ticker = String(Number(ticker));

      return {
        ticker,
        exchange,
        asset_class,
        currency,
      };
    },
    search_to_instm: async (result: tv.search_res_t) => {
      const { symbol: ticker, source2, isin, currency_code: currency } = result;
      const { id: exchange } = source2;
      return {
        exchange,
        ticker,
        currency,
        isin,
      };
    },
    add_i_id: (instm: Partial<instrmnt_t>) => {
      const { exchange, ticker } = instm;
      const i_id: i_id_t = `${exchange}-${ticker}`;
      instm.i_id = i_id;
      return instm;
    },
    det_from_html: (html?: string) => {
      if (!html) return;
      const regex =
        /<script type="application\/prs\.init\-data\+json">([\s\S]*?)<\/script>/gi;
      let data: tv.asset.data = [...html.matchAll(regex)]
        .map((m) => JSON.parse(m[1]!))
        .filter((data) => {
          return !!(Object.values(data)[0] as any)?.data?.symbol
            ?.ast_business_description;
        })[0];
      data = (Object.values(data)[0] as any).data.symbol;
      return data;
    },
    merge_asset_det: (instm: Partial<instrmnt_t>, det?: tv.asset.data) => {
      if (!det) return instm;
      const { location_from_about } = this.format;
      const { asset_class } = instm;
      let asset_sector: string, website: string;
      let {
        ast_business_description,
        medium_logo_urls,
        industry: asset_industry,
        short_description: description,
      } = det;

      const svg_logo = medium_logo_urls[0]!;
      const about_instrmnt = ast_business_description.children[0]!.trim();
      description = description.trim();
      const { country_name: country, place_name: place } =
        location_from_about(about_instrmnt);

      if (asset_class === "stock") {
        const { web_site_url, sector } = det as tv.asset.data<"stock">;
        website = web_site_url;
        asset_sector = sector;
      } else {
        const { homepage } = det as tv.asset.data<"fund">;
        website = homepage;
        asset_sector = "fund";
      }

      return {
        ...instm,
        description,
        about_instrmnt,
        asset_sector,
        asset_industry,
        country,
        place,
        svg_logo,
        website,
      };
    },
    location_from_about: (about_instm: string | undefined) => {
      if (!about_instm) return undef();

      let pars = about_instm.replace(/.$/, "").split(". ");
      pars = pars.splice(pars.length - 2);
      if (pars[0]?.endsWith(pars[1] || "")) pars.pop();
      const location = pars.join()?.split(" headquartered in ")[1]?.trim();
      if (!location) return undef();

      let [place_name, country_name] = location.split(", ") as [string, string];
      return { country_name, place_name };

      function undef() {
        return { country_name: undefined, place_name: undefined };
      }
    },
    append_svg_logo: (instm: Partial<instrmnt_t>, svg?: string) => {
      instm.svg_logo = undefined;
      if (!svg) return instm;

      const repl_tv = "<!-- by TradingView -->";
      const repl_size = `<svg xmlns="http://www.w3.org/2000/svg" width="${logo_size}" height="${logo_size}" viewBox="0 0 ${logo_size} ${logo_size}">`;
      const regex = /<svg[^>]*>/;
      const match = (_m: any) => repl_size;
      instm.svg_logo = svg.replace(repl_tv, "").trim().replace(regex, match);
      return instm;
    },
    map_scanner_res: <T extends p.scanner.kind>(
      res: p.scanner.res_t,
      kind: T,
    ) => {
      const keys = this.fetcher.scanner_keys(kind);
      return res.data.reduce(
        (results, res) => {
          const { d: values, s: symbol } = res;
          const ticker = symbol.split(":")[1]!;
          results[ticker] = pair(keys, values);
          return results;
        },
        {} as { [ticker: string]: tv.scanner.data<T> },
      );

      function pair(keys: p.scanner.fields_t<T>[], values: unknown[]) {
        return keys.reduce((data, key, i) => {
          (data as any)[key] = values[i];
          return data;
        }, {} as tv.scanner.data<T>);
      }
    },
    currencies_to_tickers: (
      currencies: string[],
      base_currency: string,
      exchange: string,
    ) => {
      return currencies.map(
        (currency) =>
          `${exchange}:${base_currency}${currency}` as `${string}:${string}`,
      );
    },
    fx_keys_to_currency: (fx_pair_map: {
      [fx_pair: string]: tv.scanner.data<"forex">;
    }) => {
      const curr_map = {} as { [currency: string]: tv.scanner.data<"forex"> };
      return Object.values(fx_pair_map).reduce((fx, value) => {
        const { currency } = value;
        fx[currency] = value;
        return fx;
      }, curr_map);
    },
    live_data_ticker: (data: {
      [ticker: string]: tv.scanner.data<"global">;
    }) => {
      data = Object.entries(data).reduce(
        (data, entry) => {
          const [ticker, value] = entry;
          const { exchange } = value;
          const i_id = `${exchange}-${ticker}`;
          value.i_id = i_id as i_id_t;
          data[i_id] = value;
          return data;
        },
        {} as typeof data,
      );
      return data;
    },
  };
  protected fetcher = {
    retry_cb: lib_cb.retry.generic_factory(),
    timeout_cb: lib_cb.timeout.backoff_factory(),
    response_cb: lib_cb.response.generic,
    trace_cb: lib_cb.trace.generic,
    hosts: [
      "scanner.tradingview.com",
      "symbol-search.tradingview.com",
      "www.tradingview.com",
      "s3-symbol-logo.tradingview.com",
    ],
    constructor: () => {
      const { hosts, timeout_cb, retry_cb, response_cb } = this.fetcher;
      return [
        rpp_max,
        concurrency_max,
        "min",
        hosts,
        {
          timeout_cb,
          retry_cb,
          response_cb,
        },
      ] as const;
    },
    request: async (
      url: string,
      method: "GET" | "POST" = "GET",
      search_params: { [param: string | symbol | number]: string } = {},
      content_type:
        | "application/json"
        | "application/text" = "application/json",
      body?: string,
    ) => {
      const _params = new URLSearchParams(search_params).toString();
      url = `${url}?${_params}`;
      const init = {
        method,
        headers: {
          "User-Agent": user_agent,
          "Content-Type": content_type,
          Origin: "https://www.tradingview.com",
          Referer: "https://www.tradingview.com/",
        },
        body,
      };
      return new Request(url, init);
    },
    fetch: () => this.fetch,
    scanner_keys: (kind: p.scanner.kind) => {
      const db_table = kind === "forex" ? "forex" : "instrument_data";
      return Tables.table_cols(db_table) as db.tbl.cols<typeof db_table>[];
    },
  };
  protected fetch = new Fetch<"req">(...this.fetcher.constructor()).fetch;
}

/** Utility to look up TV scanner fields */
export class TradingViewFields extends TradingView {
  public fields = (
    market: p.scanner.kind,
  ): Promise<tv.fields.res["fields"]> => {
    let url = `https://scanner.tradingview.com/${market}/metainfo`;
    return this.fetcher
      .request(url, "POST")
      .then((req) => this.fetch<tv.fields.res>(req))
      .then((res) => res.fields);
  };

  public map_fields = (fields: tv.fields.field[]) => {
    return fields.map((r) => r.n.trim()).sort((a, b) => a.localeCompare(b));
  };
  public filter_fields = <T = string | tv.fields.field>(fields: T[]) => {
    const regex_array = this.field_filters();
    const res: { fields: T[]; filtered: T[] } = {
      fields: [],
      filtered: [],
    };
    res.fields = fields.filter((field) => {
      const key: string = typeof field === "string" ? field : (field as any).n;
      const match = regex_array.find((regex) => regex.test(key));
      if (match) res.filtered.push(field);
      return !match;
    });
    return res;
  };

  private field_filters = () => {
    const times = `H|h|M|m|Y|y|W|w|D|d|YTD|ytd|WEEK|week`;
    const numbers = `[0-9]+`;
    const delim = `\\.|\\||\\_|\\-|\\+`;
    const time = {
      start: `^(${numbers})(${times})(${delim})`,
      mid_end: `(${delim})(${numbers})?(${times})(${delim}|$)`,
    };
    const num_tags = `SMA|EMA|HullMA|CCI|RSI`;
    const ab_tags = ["_pine_close_", "tweets"].join("|");
    const tag_prefixes = {
      common: ["Low", "High", "Rec", "Recommend", "Perf", "Volatility"].join(
        "|",
      ),
      fx: [
        "Aroon",
        "Stoch",
        "Ichimoku",
        "BB",
        "Pivot",
        "DonchCh20",
        "KltChnl",
        "ADX",
        "Candle",
        "MACD",
      ].join("|"),
      global: [
        "zmijewski",
        "yield",
        "years",
        "working",
        "weighting",
        "W",
        "volume",
        "update",
        "ucits",
        "twitter",
        "transparent",
        "total",
        "top",
        "tobin",
        "time",
        "term",
        "telegram",
        "txs",
        "sustainable",
        "source",
        "social",
        "sloan",
        "sinking",
        "shrhldrs",
        "short",
        "share",
        "shares",
        "seniority",
        "sell",
        "selection",
        "revenue",
        "return",
        "research",
        "recommendation",
        "receivables",
        "quick",
        "put",
        "relative",
        "redemption",
        "provider",
        "profit",
        "principal",
        "value",
        "premature",
        "premarket",
        "preferred",
        "pre",
        "postmarket",
        "post",
        "popularity",
        "poison",
        "pledge",
        "placement",
        "piotroski",
        "ownership",
        "outstanding",
        "out",
        "original",
        "option",
        "operating",
        "oper",
        "Open",
        "open",
        "offer",
        "number",
        "net",
        "neg",
        "ncavps",
        "nav",
        "minute",
        "maturity",
        "market",
        "make",
        "low",
        "losses",
        "long",
        "leveraged",
        "leverage",
        "last",
        "large",
        "kind",
        "issuer",
        "issue",
        "issuance",
        "ipo",
        "inverse",
        "invent",
        "interst",
        "indicators",
        "index",
        "income",
        "in",
        "holds",
        "holdings",
        "has",
        "gross",
        "free",
        "earnings",
        "cash",
        "book",
        "annual",
        "non",
        "most",
        "max",
        "kl",
        "inflation",
        "graham",
        "goodwill",
        "github",
        "gap",
        "funding",
        "fundamental",
        "fully",
        "free",
        "forex",
        "float",
        "fixed",
        "final",
        "etf",
        "eps",
        "enterprise",
        "effective",
        "economic",
        "ebitda",
        "ebit",
        "earnings",
        "duration",
        "dps",
        "diluted",
        "dex",
        "debt",
        "cryptoasset",
        "crypto",
        "credit",
        "close",
        "coupon",
        "conversion",
        "circulating",
        "capital",
        "capex",
        "call",
        "buyback",
        "bus",
        "break",
        "Bond",
        "bond",
        "blockchain",
        "bid",
        "beta",
        "basis",
        "avg",
        "average",
        "at",
        "accrued",
        "active",
        "addresses",
        "after",
        "all",
        "altman",
        "amount",
        "ask",
      ].join("|"),
      price: ["to", "target", "sales", "revenue"]
        .map((p) => `price_${p}`)
        .join("|"),
      rates: ["time", "earnings"].map((p) => `rates_${p}`).join("|"),
    };
    const tag_prefix = Object.values(tag_prefixes).join("|");
    return Object.values({
      time: `${time.start}|${time.mid_end}`,
      tag: `^(${tag_prefix})(${delim})|^(${num_tags})${numbers}$|${ab_tags}`,
      enum: `\\[${numbers}\\]|(${delim})(${numbers})$`,
    }).map((rgx) => new RegExp(rgx));
  };
}

/** Trading View API interface {@link https://www.tradingview.com} */
declare global {
  namespace tv {
    namespace asset {
      type data<T = p.asset.kind> = T extends "fund"
        ? p.asset.data_fund
        : T extends "stock"
          ? p.asset.data_stock
          : p.asset.data_fund & p.asset.data_stock;
    }
    namespace fields {
      type res = {
        financial_currency: string | null;
        fields: field[];
      };
      type field = { n: string; t: string; r: null | string[] };
      type session =
        | "out_of_session"
        | "post_market"
        | "market"
        | "pre_market"
        | "holiday";
    }
    namespace scanner {
      type data<
        K extends p.scanner.kind,
        T extends db.tbl.names = p.scanner.db_table<K>,
      > = db.data<T>;
    }
    type search_t = {
      symbols_remaining: number;
      symbols: search_res_t[];
    };
    type search_res_t = {
      symbol: string;
      description: string;
      type: string;
      exchange: string;
      found_by_isin: false;
      found_by_cusip: false;
      currency_code: string;
      "currency-logoid": string;
      provider_id: string;
      source_logoid: string;
      source2: {
        id: string;
        name: string;
        description: string;
      };
      isin: string;
      source_id: string;
      country: string;
    };
  }
}

namespace p {
  export namespace scanner {
    export type kind = "global" | "forex";
    export type fields_t<T extends kind> = db.tbl.cols<db_table<T>>;
    export type db_table<T extends kind> = T extends "forex"
      ? T
      : T extends "global"
        ? "instrument_data"
        : never;
    export type res_t = {
      totalCount: number;
      data: [
        {
          s: string;
          d: unknown[];
        },
      ];
    };
  }
  export namespace asset {
    export type broker_kind = keyof typeof asset_class_map;
    export type kind = "stock" | "fund";
    export type data_fund = {
      type: "fund";
      etf_nav_symbol: string;
      homepage: string;
      primary_symbol: data.primary_symbol;
      aum: number;
      issuer: string;
      issuer_stock_symbol_data: data.issuer_stock_symbol;
      brand: string;
      asset_class: string;
      focus: `${number}`;
      expense_ratio: number;
      index_tracked: string;
      launch_date: number;
      actively_managed: `${number}`;
      category: `${number}`;
      niche: `${number}`;
      strategy: `${number}`;
      weighting_scheme: `${number}`;
      selection_criteria: `${number}`;
      shares_outstanding: number;
      legal_structure_tr: string;
      replication_method_tr: string;
      primary_advisor: string;
      holdings_region_specific_tr: string;
      ast_business_description: data.ast_business_description;
    } & data.asset_common;

    export type data_stock = {
      type: "stock";
      recommendation_mark: number;
      market_cap_basic: number;
      price_earnings_ttm: number;
      earnings_per_share_basic_ttm: number;
      net_income: number;
      total_revenue_fy: number;
      beta_1_year: number;
      total_shares_outstanding: number;
      float_shares_outstanding_current: number;
      ceo: string;
      web_site_url: string;
      location: string;
      number_of_employees: number;
      cusip: string;
      cfi_code: string;
      earnings_release_next_date_fq: number;
      earnings_publication_type_next_fq: number;
      earnings_fiscal_period_fq: string;
      earnings_per_share_fq: number;
      earnings_release_date: number;
      revenue_fq: number;
      next_earnings_fiscal_period_fq: string;
      earnings_per_share_forecast_next_fq: number;
      revenue_forecast_next_fq: number;
      has_ipo_data: boolean;
      has_ipo_details_visible: boolean;
      ipo_offer_date: number;
      ast_business_description: data.ast_business_description;
    } & data.asset_common;
  }

  namespace data {
    export type asset_common = {
      pro_symbol: string;
      short_name: string;
      exchange: string;
      typespecs: string[];
      tv_symbol_page_url_force_exchange: string[];
      is_blacklisted_in_scanner: boolean;
      ticker_title: string;
      instrument_name: string;
      medium_logo_urls: string[];
      logo: logo;
      logo_id: string;
      currency_logo_id: string;
      country: string;
      currency: string;
      currency_id: string;
      fundamental_currency_code: string;
      tv_chart_page_url: string;
      has_technicals: boolean;
      has_contracts: boolean;
      has_bonds: boolean;
      pricescale: `${number}`;
      pointvalue: number;
      is_government_benchmark_bond: boolean;
      dividends_yield?: number;
      minmov: number;
      fractional: boolean;
      has_intraday: boolean;
      all_time_high: number;
      all_time_high_day: number;
      all_time_low: number;
      all_time_low_day: number;
      fund_view_modes: fund_view_modes;
      source2: source2;
      currency_code: string;
      measure: string;
      ast_business_description: ast_business_description;
      sector: string;
      sector_url: string;
      industry: string;
      industry_url: string;
      isin_displayed: string;
      figi: figi;
      number_of_employees_fy_h: number[];
      first_bar_time_1d: number;
      short_description: string;
      trade: trade;
      is_dex_symbol: boolean;
      daily_bar: daily_bar;
    };
    export type ast_business_description = {
      type: string;
      children: string[];
    };
    export type primary_symbol = {
      pro_symbol: string;
      short_name: string;
      exchange: string;
      type: string;
      typespecs: string[];
      tv_symbol_page_url_force_exchange: string[];
      ticker_title: string;
      instrument_name: string;
      medium_logo_urls: string[];
      country: string;
    };
    export type issuer_stock_symbol = {
      short_description: string;
      logo_id: string;
      tv_symbol_page_url: string;
    };
    type logo = {
      style: string;
      logoid: string;
    };
    type fund_view_modes = {
      traditional: string[];
    };
    type source2 = {
      country: string;
      description: string;
      "exchange-type": string;
      id: string;
      name: string;
      url: string;
    };
    type figi = {
      "country-composite": string;
      "exchange-level": string;
    };
    type trade = {
      price: number;
    };
    type daily_bar = {
      close: `${number}`;
      data_update_time: `${number}.${number}`;
      high: `${number}`;
      low: `${number}`;
      open: `${number}`;
      time: `${number}`;
      update_time: `${number}.${number}`;
      volume: `${number}`;
    };
  }
}
