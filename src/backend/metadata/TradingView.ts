import Fetch, { LibCallback } from "@common/FetchManager";
import { Tables } from "@backend/database/Tables";
import { Global } from "@backend/Global";

const user_agent = "Stocks/0.0",
  logo_size = 18,
  rpp_max = 500,
  concurrency_max = 20,
  lib_cb = new LibCallback<"req">();

const asset_class_map = {
  Stock: "stock",
  Etf: "fund",
  "STK-COMMON": "stock",
  "STK-ETF": "fund",
} as const;

/** Trading View API interface {@link https://www.tradingview.com} */
export class TradingView extends Global {
  public instrmnt_lookup = async (instrmnt: g.instrmnt) => {
    const { get, frmt } = this;

    const meta = await frmt
      .to_tv(instrmnt)
      .then(get.search)
      .then(get.details)
      .then(get.svg);

    return [meta, instrmnt] as const;
  };
  public forex = (root_currency: string, currencies: string[]) => {
    const { frmt } = this;
    const exchange = "FX_IDC",
      kind = "forex",
      types: [typeof kind] = [kind],
      tickers = frmt.currencies_to_tickers(currencies, root_currency, exchange);

    return this.scanner<"forex">(tickers, types, kind).then((currencies) =>
      frmt.add_base_fx(Object.values(currencies), root_currency),
    );
  };
  public live_instrmnts = (metas: g.meta[]) => {
    const { frmt } = this;
    const tickers = metas.map((m) => `${m.p_id.replace("-", ":")}` as p.ticker);
    return this.scanner(tickers, ["stock", "fund"], "global").then(
      frmt.res_to_positn,
    );
  };
  protected scanner = async <T extends p.scanner.kind>(
    tickers: p.ticker[],
    types: T extends "global" ? p.asset.kind[] : ["forex"],
    kind: T,
  ): Promise<{
    [ticker: string]: tv.scanner.data<T>;
  }> => {
    if (!tickers.length) {
      logger.error(`No tickers provided to TV scanner: ${types}, ${kind}`);
      return {};
    }

    const { frmt, fetcher } = this,
      columns = this.fetcher.scanner_keys(kind),
      url = `https://scanner.tradingview.com/${kind}/scan`,
      query = { types },
      symbols = { tickers, query },
      body = JSON.stringify({
        symbols,
        columns,
      });
    return fetcher
      .request(url, "POST", {}, "application/json", body)
      .then((req) => this.fetch<p.scanner.res>(req))
      .then((res) => frmt.map_scanner_res(res, kind));
  };
  private get = {
    search: async (meta: g.meta) => {
      const url = "https://symbol-search.tradingview.com/symbol_search/v3",
        { ticker, exchange, currency } = meta,
        { fetch, frmt, get, fetcher } = this,
        text = ticker,
        hl = "true";
      return fetcher
        .request(url, "GET", { text, hl })
        .then((req) => fetch<tv.search_container>(req))
        .then(purge_result_ems)
        .then(filter_results)
        .then(ranked_results)
        .then(scanner_has_symbol)
        .then((res) => frmt.search_to_meta(meta, res));

      function purge_result_ems(results: tv.search_container) {
        return results.symbols.map((result) => {
          const entries = Object.entries(result).map(([key, val]) => [
            key,
            purge_val_em(val),
          ]);
          return Object.fromEntries(entries) as tv.search_res;
        });
      }
      function purge_val_em(val: any) {
        if (typeof val !== "string") return val;
        return val.replaceAll("<em>", "").replaceAll("</em>", "").trim();
      }
      function filter_results(results: tv.search_res[]) {
        return results.filter((res) => {
          return (
            res.type === meta.asset_class &&
            is_same_ticker(res.symbol, ticker) &&
            res.currency_code === currency
          );
        });
      }
      function is_same_ticker(res_symbol: string, ticker: string) {
        if (res_symbol === ticker) return true;
        const res_num = Number(res_symbol),
          ticker_num = Number(ticker);
        if (res_num === ticker_num) return true;
        return false;
      }
      function ranked_results(results: tv.search_res[]) {
        return results.sort((a, b) => {
          const a_rank = rank(a.exchange, exchange!);
          const b_rank = rank(b.exchange, exchange!);
          return b_rank - a_rank;
        });
      }
      async function scanner_has_symbol(results: tv.search_res[]) {
        let i = 0;
        let found: tv.search_res | false = false;
        while (results[i] && !found) {
          const res = results[i]!;
          found = await get
            .symbol(`${res.exchange}:${res.symbol}`)
            .then(() => res)
            .catch(() => false);
          i++;
        }
        return found || results[0];
      }
      /** Best effort to match the broker exchange code to the TV exchange code */
      function rank(tv_ex: string, broker_ex: string) {
        const tv = [...new Set(Array.from(tv_ex))];
        const broker = [...new Set(Array.from(broker_ex))];
        const tv_score = tv.filter((letter) => broker.includes(letter)).length;
        const broker_score = broker.filter((letter) =>
          tv.includes(letter),
        ).length;
        return tv_score + broker_score;
      }
    },
    symbol: (ticker: p.ticker) => {
      const { fetcher } = this;
      const fields = fetcher.scanner_keys("global");
      const url = `https://scanner.tradingview.com/symbol`;
      return fetcher
        .request(url, "GET", {
          symbol: ticker,
          fields: fields.join(","),
        })
        .then(fetch)
        .then((res) => {
          if (!res.ok) throw res;
          return res.json();
        });
    },
    details: async (meta: g.meta) => {
      if (!meta.tv_link) return meta;

      const { fetcher, frmt } = this,
        pms = [meta.tv_link, "GET", {}, "application/text"] as const,
        html = await fetcher
          .request(...pms)
          .then((req) => this.fetch<string>(req))
          .catch((_err) => undefined);

      return frmt.detail_from_html(meta, html);
    },
    svg: async (meta: g.meta) => {
      if (!meta.svg_logo) return meta;

      const { request } = this.fetcher;
      const response_cb = (res: Response) => res.text();
      meta.svg_logo = await request(meta.svg_logo)
        .then((req) => this.fetch<string>(req, { response_cb }))
        .then((logo) => this.frmt.size_svg_logo(logo));

      return meta;
    },
  };
  private frmt = {
    to_tv: async (instrmnt: g.instrmnt): Promise<g.meta> => {
      const { frmt } = this;
      let { i_id, exchange, ticker, currency, asset_class, description } =
        instrmnt;

      asset_class = frmt.asset_class(asset_class);
      exchange = exchange.toUpperCase();
      ticker = ticker.toUpperCase();
      currency = util.money.patch_currency(currency);
      if (exchange === "XHKG") ticker = String(Number(ticker));

      return {
        p_id: i_id,
        exchange,
        ticker,
        currency,
        asset_class,
        description,
      };
    },
    asset_class: (asset_class: string) => {
      if (Object.values(asset_class_map).includes(asset_class as any))
        return asset_class;

      const err_mssg = `"${asset_class}" is not a mapped asset kind`;
      asset_class = asset_class_map[asset_class as p.asset.broker_kind];
      if (!asset_class) throw err_mssg;

      return asset_class;
    },
    search_to_meta: async (meta: g.meta, result?: tv.search_res) => {
      const { frmt } = this;
      if (!result) return frmt.fix_p_id(meta);

      const { symbol: ticker, source2, isin, currency_code: currency } = result;
      const { id: exchange } = source2;

      meta = frmt.fix_p_id({
        ...meta,
        isin,
        exchange,
        ticker,
        currency,
      });
      meta.tv_link = `https://www.tradingview.com/symbols/${meta.p_id}`;

      return meta;
    },
    fix_p_id: (meta: g.meta) => {
      const { exchange, ticker } = meta;
      meta.p_id = `${exchange}-${ticker}`;
      return meta;
    },
    detail_from_html: (meta: g.meta, html: string | undefined) => {
      if (!html) return meta;
      const { frmt } = this;

      const regex =
        /<script type="application\/prs\.init\-data\+json">([\s\S]*?)<\/script>/gi;
      let data: tv.asset.data = [...html.matchAll(regex)]
        .map((m) => JSON.parse(m[1]!))
        .filter((data) => {
          return !!(Object.values(data)[0] as any)?.data?.symbol
            ?.ast_business_description;
        })[0];
      if (!data) {
        console.error(meta, html.length);
        throw "";
      }
      data = (Object.values(data)[0] as any)?.data?.symbol;
      return frmt.merge_detail(meta, data);
    },
    merge_detail: (meta: g.meta, data: tv.asset.data): g.meta => {
      if (!data) return meta;

      const { frmt } = this;
      const { asset_class } = meta;
      let asset_sector: string, website: string;
      let {
        ast_business_description,
        medium_logo_urls,
        industry: asset_industry,
        short_description: description,
      } = data;

      const svg_logo = medium_logo_urls[0]!;
      const about_instrmnt = ast_business_description.children[0]!.trim();
      description = description.trim();
      const { country, place } = frmt.location_from_about(about_instrmnt);

      if (asset_class === "stock") {
        const { web_site_url, sector } = data as tv.asset.data<"stock">;
        website = web_site_url;
        asset_sector = sector;
      } else {
        const { homepage } = data as tv.asset.data<"fund">;
        website = homepage;
        asset_sector = "fund";
      }

      return {
        ...meta,
        asset_class,
        description,
        about_instrmnt,
        asset_sector,
        asset_industry,
        svg_logo,
        website,
        country,
        place,
      };
    },
    location_from_about: (about_instm: string | undefined): g.meta_geo => {
      if (!about_instm) return {};

      let pars = about_instm.replace(/.$/, "").split(". ");
      pars = pars.splice(pars.length - 2);
      if (pars[0]?.endsWith(pars[1] || "")) pars.pop();
      const location = pars.join()?.split(" headquartered in ")[1]?.trim();
      if (!location) return {};

      let [place, country] = location.split(", ") as [string, string];
      place = this.frmt.hacky_place_fix(place);
      return { country, place };
    },
    hacky_place_fix: (place: string) => {
      if (place === "Northlands") place = "Illovo";
      return place;
    },
    size_svg_logo: (svg_logo: string) => {
      const repl_tv = "<!-- by TradingView -->";
      const repl_size = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${logo_size} ${logo_size}">`;
      const regex = /<svg[^>]*>/;
      const match = (_m: any) => repl_size;

      return svg_logo.replace(repl_tv, "").trim().replace(regex, match);
    },
    map_scanner_res: <T extends p.scanner.kind>(
      res: p.scanner.res,
      kind: T,
    ) => {
      const fields = this.fetcher.scanner_keys<T>(kind);
      return res.data.reduce(
        (results, res) => {
          const { d: values, s: symbol } = res;
          const ticker = symbol.split(":")[1]!;
          results[ticker as p.ticker] = pair(fields, values);
          return results;
        },
        {} as { [ticker: string]: tv.scanner.data<T> },
      );

      function pair(fields: p.scanner.fields<T>[], values: unknown[]) {
        return fields.reduce((data, key, i) => {
          (data as any)[key] = values[i];
          return data;
        }, {} as tv.scanner.data<T>);
      }
    },
    currencies_to_tickers: (
      currencies: string[],
      root_currency: string,
      exchange: string,
    ) => {
      return currencies.map(
        (currency) => `${exchange}:${root_currency}${currency}` as p.ticker,
      );
    },
    add_base_fx: (forex: tv.scanner.data<"forex">[], root_currency: string) => {
      const base_fx: tv.scanner.data<"forex"> = {
        currency: root_currency,
        open: 1,
        close: 1,
        exchange: "NOOP",
      };
      forex.push(base_fx);
      return forex;
    },
    res_to_positn: (scanner_res: {
      [ticker: string]: tv.scanner.data<"global">;
    }) => {
      return Object.entries(scanner_res).reduce((positns, entry) => {
        const [ticker, value] = entry;
        const { exchange } = value;
        const p_id = `${exchange}-${ticker}`;
        value.p_id = p_id as id.p;
        positns.push(value);
        return positns;
      }, [] as tv.scanner.data<"global">[]);
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
    scanner_keys: <T extends p.scanner.kind>(kind: T) => {
      const db_table = kind === "forex" ? "live_forex" : "live_instrmnt";
      return Object.keys(Tables.tables[db_table]).filter(
        (k) => k !== "p_id",
      ) as p.scanner.fields<T>[];
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
      type data<T extends p.scanner.kind> = T extends "global"
        ? db.data<"live_instrmnt">
        : db.data<"live_forex">;
    }
    type search_container = {
      symbols_remaining: number;
      symbols: search_res[];
    };
    type search_res = {
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
    type forex = tv.scanner.data<"forex">[];
  }
}
namespace p {
  export type ticker = `${string}:${string}`;
  export namespace scanner {
    export type kind = "global" | "forex";
    export type fields<T extends kind> = T extends "global"
      ? Exclude<db.tbl.col_names<"live_instrmnt">, "p_id">
      : db.tbl.col_names<"live_forex">;
    export type res = {
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
