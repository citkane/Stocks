import Fetch, {
  type frm_debug_data_t,
  type frm_host_t,
} from "@common/FetchRateManager";

const user_agent = "Stocks/0.0",
  logo_size = 32,
  req_per_min_max = 500,
  req_concurrency_max = 20,
  scanner_fields = [
    "name",
    "description",
    "exchange",
    "currency",
    "base_currency_kind",
    "subtype",
    "type",
    "typespecs",
    "asset_class",
    "is_primary",
    "is_symbol_primary_listing",
    "sector",
    "industry",
    "market",
    "index",
    "close",
    "price_sales",
    "change",
    "dividends_frequency",
    "dividends_paid",
    "dividend_frequency_recent",
    "dividends_yield",
    "dividends_yield_fy",
    "total_cash_dividends_paid_fy",
    "total_cash_dividends_paid_fq",
    "dividend_yield_recent",
    "dividends_yield_current",
    "dividend_ex_date_upcoming",
    "ex_dividend_date_upcoming",
    "dividend_payment_date_recent",
    "dividend_payment_date_upcoming",
    "dividend_ex_date_recent",
    "yield_upcoming",
    "indicated_annual_dividend",
    "expected_annual_dividends",
    "category",
    "holdings_region",
    "source-logoid",
    "base_currency_kind",
    "is_blacklisted",
  ] as const,
  asset_class_map = {
    Stock: "stock",
    COMMON: "stock",
    Etf: "fund",
    ETF: "fund",
  } as const;

export class TradingView {
  public find_instrmnt = async (
    brkr_asset_class: broker_asset_class_t,
    brkr_exchange: string,
    brkr_ticker: string,
    currency: string,
  ): Promise<Partial<instrmnt_t>> => {
    const asset_class = asset_class_map[brkr_asset_class];
    brkr_exchange = brkr_exchange.toUpperCase();
    brkr_ticker = brkr_ticker.toUpperCase();
    currency = currency === "CNH" ? "CNY" : currency;
    currency = currency === "ZAR" ? "ZAC" : currency;
    if (brkr_exchange === "XHKG") brkr_ticker = String(Number(brkr_ticker));

    let instrmnt: Partial<instrmnt_t> = {
      i_id: `${brkr_exchange}-${brkr_ticker}`,
      exchange: brkr_exchange,
      ticker: brkr_ticker,
      asset_class,
      currency,
    };
    const found_instrmnt = await this.search(
      brkr_ticker,
      brkr_exchange,
      asset_class,
      currency,
    );
    if (!found_instrmnt) return instrmnt;

    instrmnt = { ...instrmnt, ...found_instrmnt };
    const { ticker, exchange } = found_instrmnt;
    const asset_details = await this.asset_details(
      exchange,
      ticker,
      asset_class,
    );
    const svg_logo = await this.fetch_svg_string(asset_details.svg_logo);
    instrmnt = { ...instrmnt, ...asset_details, svg_logo };

    return instrmnt;
  };
  private asset_details = async (
    tv_exchange: string,
    tv_symbol: string,
    tv_asset_class: asset_class_t,
  ) => {
    let url = "https://www.tradingview.com/symbols";
    url = `${url}/${tv_exchange}-${tv_symbol}`;
    const req = this.fetcher.request(url, "GET", {}, "application/text");
    const html = await this.fetch<string>(req);
    const data = data_from_html(html);

    return to_instrmnt(data);

    function data_from_html(html: string) {
      const regex =
        /<script type="application\/prs\.init\-data\+json">([\s\S]*?)<\/script>/gi;
      let data: asset_data_t = [...html.matchAll(regex)]
        .map((m) => JSON.parse(m[1]!))
        .filter((data) => {
          return !!(Object.values(data)[0] as any)?.data?.symbol
            ?.ast_business_description;
        })[0];
      data = (Object.values(data)[0] as any).data.symbol;
      return data;
    }
    function to_instrmnt(data: asset_data_t) {
      const i_id: i_id_t = `${tv_exchange}-${tv_symbol}`;
      let asset_sector: string, website: string;
      const {
        ast_business_description,
        instrument_name: description,
        medium_logo_urls,
        industry: asset_industry,
      } = data;

      const svg_logo = medium_logo_urls[0]!;
      const about_instrmnt = ast_business_description.children[0]!.trim();
      const { country_name: country, place_name: place } =
        parse_location(about_instrmnt);
      if (tv_asset_class === "stock") {
        const { web_site_url, sector } = data as asset_data_t<"stock">;
        website = web_site_url;
        asset_sector = sector;
      } else {
        const { homepage } = data as asset_data_t<"fund">;
        website = homepage;
        asset_sector = "fund";
      }

      return {
        i_id,
        description,
        about_instrmnt,
        asset_sector,
        asset_industry,
        country,
        place,
        svg_logo,
        website,
      };
    }
    function parse_location(about_instrmnt: string | undefined) {
      if (!about_instrmnt) return undef();

      let pars = about_instrmnt.replace(/.$/, "").split(". ");
      pars = pars.splice(pars.length - 2);
      if (pars[0]?.endsWith(pars[1] || "")) pars.pop();
      const location = pars.join()?.split(" headquartered in ")[1]?.trim();
      if (!location) return undef();

      let [place_name, country_name] = location.split(", ") as [string, string];
      return { country_name, place_name };

      function undef() {
        return { country_name: undefined, place_name: undefined };
      }
    }
  };
  private search = async (
    ticker: string,
    exchange: string,
    asset_class: asset_class_t,
    currency: string,
  ) => {
    let url = "https://symbol-search.tradingview.com/symbol_search/v3";
    const params = {
      text: ticker,
      hl: "true",
    };
    const req = this.fetcher.request(url, "GET", params);
    const result = await this.fetch<search_t>(req);
    const instrmnts = result.symbols
      .map(purge_result_ems)
      .filter(filter_fn)
      .sort(ranker);
    const instrmnt = format(instrmnts[0]!);
    return instrmnt;

    function purge_result_ems(result: search_res_t) {
      return Object.keys(result).reduce((result, key) => {
        const k = key as keyof search_res_t;
        if (typeof result[k] === "string")
          (result as any)[k] = purge(result[k]);
        return result;
      }, result);
      function purge(val: string) {
        return val.replaceAll("<em>", "").replaceAll("</em>", "").trim();
      }
    }
    function filter_fn(result: search_res_t) {
      return (
        result.type === asset_class &&
        is_same_ticker(result.symbol, ticker) &&
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
    function ranker(a: search_res_t, b: search_res_t) {
      const a_rank = rank(a.exchange, exchange);
      const b_rank = rank(b.exchange, exchange);
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
    async function format(result: search_res_t) {
      const { symbol: ticker, source2, isin, currency_code: currency } = result;
      const { id: exchange } = source2;
      const i_id: i_id_t = `${exchange}-${ticker}`;
      return {
        i_id,
        exchange,
        ticker,
        currency,
        isin,
      };
    }
  };
  private fetch_svg_string = async (url?: string) => {
    if (!url) return undefined;
    const req = this.fetcher.request(url);
    let svg_string = await this.fetch<string>(req);
    svg_string = svg_string.replace("<!-- by TradingView -->", "").trim();
    svg_string = svg_string.replace(/<svg[^>]*>/, (_match) => {
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${logo_size}" height="${logo_size}" viewBox="0 0 ${logo_size} ${logo_size}">`;
    });
    return svg_string;
  };
  private scanner = (tv_exchange: string, tv_ticker: string) => {
    const symbol = `${tv_exchange}:${tv_ticker}`;
    let url = "https://scanner.tradingview.com/symbol";
    const fields = scanner_fields.join(",");
    const params = {
      fields,
      symbol,
    };
    const req = this.fetcher.request(url, "GET", params);
    return this.fetch<scanner_result_t>(req);
  };
  private meta = (market: string) => {
    let url = `https://scanner.tradingview.com/${market}/metainfo`;
    const req = this.fetcher.request(url, "POST");
    return this.fetch(req);
  };

  private fetcher = {
    should_retry: (_res: Response) => true,
    set_retry_timeout_ms: (_res: Response) => 1000,
    data_resolver: async (res: Response) => {
      const type = res.headers.get("content-type");
      const data = type?.includes("json") ? await res.json() : await res.text();
      return data;
    },
    debug_callback: (data: frm_debug_data_t, message?: string) => {
      if (message) console.warn(message);
      console.debug(data);
    },
    hosts: () =>
      [
        "scanner.tradingview.com",
        "symbol-search.tradingview.com",
        "www.tradingview.com",
        "s3-symbol-logo.tradingview.com",
      ].map((hostname) => {
        return {
          hostname,
          should_retry: this.fetcher.should_retry,
          set_retry_timeout_ms: this.fetcher.set_retry_timeout_ms,
        } as frm_host_t;
      }),
    constructor: () =>
      [
        req_per_min_max,
        req_concurrency_max,
        "min",
        this.fetcher.hosts(),
        this.fetcher.data_resolver,
        this.fetcher.debug_callback,
      ] as const,
    request: (
      url: string,
      method: "GET" | "POST" = "GET",
      params: { [param: string]: string } = {},
      content_type:
        | "application/json"
        | "application/text" = "application/json",
      body?: string,
    ) => {
      const _params = new URLSearchParams(params).toString();
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
  };
  private fetch = new Fetch(...this.fetcher.constructor()).fetch;
}

type search_t = { symbols_remaining: number; symbols: search_res_t[] };
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
type scanner_result_t = {
  [key in (typeof scanner_fields)[number]]: any;
};
type asset_class_t = "stock" | "fund";
type broker_asset_class_t = keyof typeof asset_class_map;

type asset_data_t<T = asset_class_t> = T extends "fund"
  ? asset_data_fund
  : T extends "stock"
    ? asset_data_stock
    : asset_data_fund & asset_data_stock;

type asset_data_common_t = {
  pro_symbol: string;
  short_name: string;
  exchange: string;
  typespecs: string[];
  tv_symbol_page_url_force_exchange: string[];
  is_blacklisted_in_scanner: boolean;
  ticker_title: string;
  instrument_name: string;
  medium_logo_urls: string[];
  logo: logo_t;
  logo_id: string;
  currency_logo_id: string;
  country: string;
  currency: currency_t;
  currency_id: currency_t;
  fundamental_currency_code: currency_t;
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
  fund_view_modes: fund_view_modes_t;
  source2: source2_t;
  currency_code: string;
  measure: string;
  ast_business_description: ast_business_description_t;
  sector: string;
  sector_url: string;
  industry: string;
  industry_url: string;
  isin_displayed: string;
  figi: figi_t;
  number_of_employees_fy_h: number[];
  first_bar_time_1d: number;
  short_description: string;
  trade: trade_t;
  is_dex_symbol: boolean;
  daily_bar: daily_bar_t;
};

type asset_data_fund = {
  type: "fund";
  etf_nav_symbol: string;
  homepage: string;
  primary_symbol: primary_symbol_t;
  aum: number;
  issuer: string;
  issuer_stock_symbol_data: issuer_stock_symbol_data_t;
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
  ast_business_description: ast_business_description_t;
} & asset_data_common_t;
type asset_data_stock = {
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
  ast_business_description: ast_business_description_t;
} & asset_data_common_t;
type logo_t = {
  style: string;
  logoid: string;
};
type ast_business_description_t = {
  type: string;
  children: string[];
};
type primary_symbol_t = {
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
type issuer_stock_symbol_data_t = {
  short_description: string;
  logo_id: string;
  tv_symbol_page_url: string;
};
type fund_view_modes_t = {
  traditional: string[];
};
type source2_t = {
  country: string;
  description: string;
  "exchange-type": string;
  id: string;
  name: string;
  url: string;
};
type figi_t = {
  "country-composite": string;
  "exchange-level": string;
};
type trade_t = {
  price: number;
};
type daily_bar_t = {
  close: `${number}`;
  data_update_time: `${number}.${number}`;
  high: `${number}`;
  low: `${number}`;
  open: `${number}`;
  time: `${number}`;
  update_time: `${number}.${number}`;
  volume: `${number}`;
};

//  protected scrape_instruments = (i_ids: i_id_t[]) =>
//    this.instrmnts.scrape(i_ids);
//  //public live_data = (postns: b.positn_t[]) => this.fetch_live_data(postns);
//
//  protected fetch_live_data = async (
//    postns: b.positn_t[],
//  ): Promise<live_data_t[]> => {
//    const i_ids = postns.map((p) => p.i_id);
//    const data = await this.html.scrape(i_ids);
//    return data
//      .map((_data, i) => {
//        const [i_id, data] = _data;
//        if (!data) return;
//
//        const postn = postns[i]!;
//        let { currency } = postn;
//        currency = currency === "XXX" ? data.currency : currency;
//        currency = currency === "CNY" ? "CNH" : currency;
//        const { price: price_market } = data.trade;
//        const { dividends_yield: div_yield } = data;
//        return { i_id, price_market, div_yield };
//      })
//      .filter((d) => !!d);
//  };
//  private html = {
//    scrape: async (i_ids: i_id_t[]) => {
//      const urls = i_ids.map((i_id) => this.html.url(i_id));
//      const htmls = await Promise.all(urls.map(this.html.fetch));
//      const tv_data = await Promise.all(htmls.map(this.html.parse));
//      return i_ids.map((i_id, i) => {
//        const data = tv_data[i];
//        const html = htmls[i];
//        return [i_id, data, html];
//      }) as tv_data_raw_t[];
//    },
//    parse: (html?: string): tv_data_t | undefined => {
//      if (!html) return undefined;
//      const regex =
//        /<script type="application\/prs.init-data\+json">(.*?)<\/script>/gs;
//      const matches = [];
//      let match;
//      while ((match = regex.exec(html)) !== null) {
//        matches.push(match[1]?.trim());
//      }
//      const jsons = matches.map((m) => JSON.parse(m!));
//      const _data = jsons.find(
//        (js) => js[Object.keys(js)[0]!]?.data?.symbol?.measure,
//      );
//      const data = !!_data && _data[Object.keys(_data)[0]!]?.data?.symbol;
//      return data;
//    },
//    fetch: async (url: string) => {
//      const html = await fetch(url).then((res) =>
//        res.ok ? res.text() : undefined,
//      );
//      return !!html
//        ? html.trim()
//        : (logger.warn(`No data found for ${url}`) as undefined);
//    },
//    url: (p_id: i_id_t, endpoint = "") => {
//      return `${tv_url}/${p_id}/${endpoint}`;
//    },
//  };
//  private instrmnts = {
//    scrape: async (i_ids: i_id_t[]) => {
//      const tv_data_raw = await this.html.scrape(i_ids);
//      const part_instrmnts = tv_data_raw.map(this.instrmnts.part_instrmnt);
//      await this.tv_data.init_dom();
//
//      for (let i = 0; i < tv_data_raw.length; i++) {
//        this.bootstrap(
//          `Updating instrument [${i + 1}] of [${tv_data_raw.length}]`,
//        );
//        const [i_id, tv_data, html] = tv_data_raw[i]!;
//        let part_instrmnt = part_instrmnts[i];
//        const positn = this.brokers.cache.positions[i_id]!;
//        const { saxo_id, ibkr_id, description, currency } = positn;
//
//        if (!part_instrmnt || !tv_data || !html) {
//          logger.info("Metadata for instrument not found:", i_id);
//
//          const [exchange, ticker] = i_id!.split("-") as [string, string];
//          const instrmnt = {
//            i_id: i_id!,
//            exchange,
//            ticker,
//            description,
//            currency,
//            saxo_id,
//            ibkr_id,
//          } as instrmnt_t;
//          logger.debug("inserting instrument:", instrmnt.i_id);
//          await this.db.insert.instruments([instrmnt]);
//          logger.debug(
//            "-----------------------------------------------------------------------------",
//          );
//          continue;
//        }
//        part_instrmnt = {
//          ...part_instrmnt,
//          saxo_id,
//          ibkr_id,
//          description,
//          currency,
//        };
//        const data = [part_instrmnt, tv_data, html] as const;
//        let [instrmnt] = await Promise.all([
//          this.instrmnts.merge_instrmnt(...data),
//          this.instrmnts.location(part_instrmnt),
//        ]);
//        logger.debug("inserting instrument:", instrmnt.i_id);
//        await this.db.insert.instruments([instrmnt]);
//
//        logger.debug(
//          "-----------------------------------------------------------------------------",
//        );
//      }
//    },
//
//    part_instrmnt: (tv_data: tv_data_raw_t) => {
//      const [i_id, data] = tv_data;
//      if (!data) return undefined;
//      let {
//        type: asset_class,
//        instrument_name: description,
//        medium_logo_urls: _svg_strings,
//        ast_business_description: _about,
//        short_name: ticker,
//        exchange,
//        currency,
//        isin_displayed: isin,
//      } = data;
//
//      const svg_logo = _svg_strings[0]!;
//      const about_instrmnt = _about.children[0]!;
//
//      let instrumnt = {
//        i_id,
//        ticker,
//        exchange,
//        currency,
//        description,
//        about_instrmnt,
//        asset_class,
//        isin,
//        svg_logo,
//      };
//      return Object.keys(instrumnt).reduce(
//        (c, key) => {
//          c[key] = instrumnt[key as keyof typeof instrumnt]?.trim();
//          return c;
//        },
//        {} as { [key: string]: any },
//      ) as Partial<instrmnt_t>;
//    },
//    merge_instrmnt: async (
//      part_instrmnt: Partial<instrmnt_t>,
//      tv_data: tv_data_t,
//      html: string,
//    ) => {
//      let website!: string,
//        asset_sector!: string,
//        asset_industry!: string,
//        cfi: string | undefined = undefined;
//      let { asset_class, svg_logo } = part_instrmnt;
//      const { sector, industry } = tv_data;
//      switch (asset_class) {
//        case "fund":
//          const { homepage } = tv_data as tv_data_t<"fund">;
//          const scraped_data = await this.tv_data.eval(util.html.escape(html));
//          website = homepage;
//          asset_sector = scraped_data.asset_sector;
//          asset_industry = scraped_data.asset_industry;
//          break;
//        case "stock":
//          const { web_site_url, cfi_code } = tv_data as tv_data_t<"stock">;
//          website = web_site_url;
//          cfi = cfi_code;
//          asset_sector = sector;
//          asset_industry = industry;
//          break;
//      }
//      svg_logo = await this.instrmnts.svg(svg_logo);
//      return {
//        ...part_instrmnt,
//        ...{ website, asset_sector, asset_industry, cfi, svg_logo: svg_logo },
//      } as instrmnt_t;
//    },
//    location: (instrmnt?: Partial<instrmnt_t>) => {
//      if (!instrmnt) return undefined;
//      const { i_id, about_instrmnt } = instrmnt;
//      const { place_name, country_name } = util.parse_location(about_instrmnt);
//      return this.geo_location(i_id!, place_name, country_name).catch((err) =>
//        logger.error(err),
//      );
//    },
//    svg: async (svg_url: string | undefined) => {
//      if (!svg_url) return undefined;
//      let svg = await fetch(svg_url).then((svg) => svg.text());
//      svg = svg.replace("<!-- by TradingView -->", "");
//      svg = await this.tv_data.eval_logo(util.html.escape(svg));
//      return svg;
//    },
//  };
//  private tv_data = {
//    init: false,
//    init_dom: async () => {
//      if (this.tv_data.init) return;
//      this.tv_data.init = true;
//      const eval_str = `(() => {
//        window.util = { html: { ${string_fns(util.html)} }};
//        window.q = new class { query = { ${string_fns(this.query)} }};
//    })()`;
//      await wv.evaluate(eval_str);
//
//      function string_fns(ob: Object): string {
//        return Object.keys(ob).reduce((c, key) => {
//          const k = key as keyof typeof ob;
//          const val = ob[k];
//          return (c += ` ${key}: ${val.toString()},`);
//        }, "");
//      }
//    },
//    eval: async (html: string): Promise<meta_data_t> => {
//      const str = `((html) => this.q.query.data(html))(${html})`;
//      const data = await wv.evaluate<scrape_data_raw_t>(str);
//
//      let { stats: _stats, asset_class } = data;
//      const stats_fmted = _stats
//        .filter((s) => s[1] !== "—")
//        .map(this.tv_data.format_stat);
//
//      const stats = this.tv_data.reduce_stats(stats_fmted);
//      const { asset, fund } = stats;
//      asset_class = asset_class?.split(" ")[0]!;
//      const asset_sector = asset?.sector || asset_class;
//      const asset_industry = asset?.industry || fund_indstry() || asset_class;
//      const formatted_data = {
//        asset_sector,
//        asset_industry,
//        ...stats,
//      };
//
//      return formatted_data;
//
//      function fund_indstry() {
//        if (!fund) return;
//        const { category, niche, class: _class } = fund;
//        if (!_class && !category && !niche) return;
//        return [_class, category, niche].filter((cat) => !!cat).join("/");
//      }
//    },
//    reduce_stats: (stats: raw_stat_t[]) =>
//      stats.reduce((c, stat) => {
//        let [title, val] = stat;
//        const [sect, catg] = title.split("_");
//        if (!catg) {
//          c = { ...c, ...{ [sect!]: val } };
//          return c;
//        }
//        (c as any)[sect!] = {
//          ...((c as any)[sect!] || {}),
//          ...{ [catg]: val },
//        };
//        return c;
//      }, {} as stats_t),
//    format_stat: (stat: raw_stat_t): raw_stat_t => {
//      let [title, val] = stat;
//      val = util.string.clean_unicode(val as string);
//      title = title.replace(/Identifiers\w*/, "isin");
//      switch (title) {
//        case "Market capitalization":
//          title = "asset_capitalisation";
//          val = this.tv_data.number_val(val);
//          break;
//        case "Dividend yield (indicated)":
//          title = "dividend_yield";
//          val = this.tv_data.number_perc(val);
//          break;
//        case "Price to earnings Ratio (TTM)":
//          title = "asset_pe";
//          val = Number(val);
//          break;
//        case "Basic EPS (TTM)":
//          title = "asset_eps";
//          val = this.tv_data.number_val(val);
//          break;
//        case "Net income (FY)":
//          title = "company_income";
//          val = this.tv_data.number_val(val);
//          break;
//        case "Revenue (FY)":
//          title = "company_revenue";
//          val = this.tv_data.number_val(val);
//          break;
//        case "Shares float":
//          title = "asset_shares";
//          val = this.tv_data.number_val(val);
//          break;
//        case "Beta (1Y)":
//          title = "asset_beta";
//          val = Number(val);
//          break;
//        case "Employees (FY)":
//          title = "employees_number";
//          val = this.tv_data.number_val(val);
//          break;
//        case "Change (1Y)":
//          title = "employees_change";
//          val = val.split(" ");
//          let amount: number, change: [number, string];
//          if (val.length === 1) {
//            amount = Number(val[0]);
//            change = [0, "%"];
//          } else if (val.length === 3) {
//            amount = this.tv_data.number_val(`${val[0]} ${val[1]}`) as number;
//            change = this.tv_data.number_perc(val[2] as string);
//          } else {
//            amount = Number(val[0]);
//            change = this.tv_data.number_perc(val[1] as string);
//          }
//          val = [amount, ...change];
//          break;
//        case "Revenue / Employee (1Y)":
//          title = "employees_revenue";
//          val = this.tv_data.number_val(val);
//          break;
//        case "Net income / Employee (1Y)":
//          title = "employees_income";
//          val = this.tv_data.number_val(val);
//          break;
//        case "Sector":
//          title = "asset_sector";
//          break;
//        case "Industry":
//          title = "asset_industry";
//          break;
//        case "CEO":
//          title = "company_ceo";
//          break;
//        case "Website":
//          title = "website";
//          break;
//        case "Headquarters":
//          title = "company_headquarters";
//          break;
//        case "Founded":
//          title = "company_founded";
//          break;
//        case "IPO date":
//          title = "asset_ipo";
//          break;
//        case "isin":
//          val = val.split(" ")[1]!;
//          break;
//        case "Assets under management (AUM)":
//          title = "fund_assets";
//          val = this.tv_data.number_val(val);
//          break;
//        case "Fund flows (1Y)":
//          title = "fund_flows";
//          val = this.tv_data.number_val(val);
//          break;
//        case "Discount/Premium to NAV":
//          title = "fund_nav";
//          val = this.tv_data.number_perc(val);
//          break;
//        case "Shares outstanding":
//          title = "fund_outstanding";
//          val = this.tv_data.number_val(val);
//          break;
//        case "Expense ratio":
//          title = "fund_ratio";
//          val = this.tv_data.number_perc(val);
//          break;
//        case "Issuer":
//          title = "fund_issuer";
//          break;
//        case "Brand":
//          title = "fund_brand";
//          break;
//        case "Home page":
//          title = "website";
//          break;
//        case "Inception date":
//          title = "fund_inception";
//          break;
//        case "Structure":
//          title = "fund_structure";
//          break;
//        case "Index tracked":
//          title = "fund_index";
//          break;
//        case "Replication method":
//          title = "fund_replication";
//          break;
//        case "Management style":
//          title = "fund_style";
//          break;
//        case "Dividend treatment":
//          title = "fund_dividend";
//          break;
//        case "Primary advisor":
//          title = "fund_advisor";
//          break;
//        case "CFI code":
//          title = "cfi";
//          break;
//        case "Asset Class":
//          title = "fund_class";
//          break;
//        case "Category":
//          title = "fund_category";
//          break;
//        case "Focus":
//          title = "fund_focus";
//          break;
//        case "Niche":
//          title = "fund_niche";
//          break;
//        case "Strategy":
//          title = "fund_strategy";
//          break;
//        case "Geography":
//          title = "fund_geography";
//          break;
//        case "Weighting scheme":
//          title = "fund_weighting";
//          break;
//        case "Selection criteria":
//          title = "fund_selection";
//          break;
//      }
//      return [title, val];
//    },
//    eval_logo: async (svg_str: string) => {
//      const str = `((svg_logo) => q.query.svg(svg_logo, ${logo_size}))(${svg_str})`;
//      return await wv.evaluate<string>(str);
//    },
//    number_val: (val: string) => {
//      const multipliers = ["K", "M", "B", "T"];
//      let _val: (string | number)[] = val.split(" ");
//      _val[0] = Number(_val[0]);
//      if (isNaN(_val[0])) return val;
//      if (!multipliers.includes(_val[1] as string)) return _val;
//
//      switch (_val[1]) {
//        case "K":
//          _val[0] = Math.round(_val[0] * 1000);
//          break;
//        case "M":
//          _val[0] = Math.round(_val[0] * 1000000);
//          break;
//        case "B":
//          _val[0] = Math.round(_val[0] * 1000000000);
//          break;
//        case "T":
//          _val[0] = Math.round(_val[0] * 1000000000000);
//          break;
//      }
//      _val.splice(1, 1);
//      if (_val.length === 1) return _val[0];
//      return _val;
//    },
//    number_perc: (val: string) => {
//      const _val: (number | string)[] = val.split("%");
//      _val[0] = Number(_val[0]);
//      _val[1] = "%";
//      return _val as [number, string];
//    },
//  };
//  private query = {
//    to_fragment: (html: string) => {
//      const template = document.createElement("template");
//      template.innerHTML = util.html.unescape(html);
//      return template.content;
//    },
//    data: (html: string): scrape_data_raw_t => {
//      const dom = this.query.to_fragment(html);
//      return {
//        asset_class: this.query.class(dom)!,
//        stats: this.query.stats(dom),
//      };
//    },
//    class: (dom: DocumentFragment) => {
//      return dom.querySelector<HTMLElement>(
//        `nav[class^="breadcrumbsContainer-"] li:nth-child(3) span[class^="breadcrumbContent-"]`,
//      )?.innerText;
//    },
//    stats: (dom: DocumentFragment) => {
//      return [
//        ...dom.querySelectorAll('[class^="widgets-"] .block-ststB_hQ'),
//      ].reduce((c, stat) => {
//        let val: string;
//        let label = sel(stat, ".label-ststB_hQ").innerText!;
//        const is_url = label === "Home page" || label === "Website";
//        val = is_url
//          ? sel(stat, ".link-ststB_hQ").getAttribute("href")!
//          : sel(stat, ".value-ststB_hQ").innerText!;
//        c.push([label, val]);
//
//        return c;
//      }, [] as raw_stat_t[]);
//
//      function sel(stat: Element, q: string) {
//        return stat.querySelector(q)! as HTMLElement;
//      }
//    },
//    svg: (svg_logo: string, size: number) => {
//      svg_logo = util.html.unescape(svg_logo);
//      const logo = new DOMParser().parseFromString(
//        svg_logo,
//        "image/svg+xml",
//      ).documentElement;
//      logo.setAttribute("viewBox", "0 0 18 18");
//      //logo.setAttribute("width", String(size));
//      //logo.setAttribute("height", String(size));
//      return logo.outerHTML;
//    },
//  };
//

//private wd = new WikiData();
//}

/*
declare global {
  type asset_t = {
    capitalisation: [number, currency_t];
    pe: number;
    eps: [number, currency_t];
    shares: number;
    beta: number;
    ipo: string;
    sector: string;
    industry: string;
  };
  type company_t = {
    income: [number, currency_t];
    revenue: [number, currency_t];
    ceo: string;
    headquarters: string;
    founded: string;
  };
  type employees_t = {
    number: number;
    change: [number, number, "%"];
    revenue: [number, currency_t];
    income: [number, currency_t];
  };
  type fund_t = {
    assets: [number, currency_t];
    flows: [number, currency_t];
    nav: [number, "%"];
    outstanding: number;
    ratio: [number, "%"];
    issuer: string;
    brand: string;
    inception: string;
    structure: string;
    index: string;
    replication: string;
    style: string;
    dividend: string;
    advisor: string;
    class: string;
    category: string;
    focus: string;
    niche: string;
    strategy: string;
    geography: string;
    weighting: string;
    selection: string;
  };
  type dividend_t = {
    yield: [number, "%"];
  };
}
type stats_t = {
  asset?: asset_t;
  fund?: fund_t;
  company?: company_t;
  employees?: employees_t;
  website: string;
  isin: string;
  cfi?: string;
};
type scrape_data_raw_t = scrape_data_t<raw_stat_t[]>;
type scrape_data_t<S extends stats_t | raw_stat_t[] = stats_t> = {
  asset_class?: string;
  asset_sector?: string;
  asset_industry?: string;
  stats: S;
};
type raw_stat_t = [string, (string | number) | (string | number)[]];
type tv_data_t<T = "fund" | "stock"> = {
  pro_symbol: string;
  short_name: string;
  exchange: string;
  typespecs: string[];
  tv_symbol_page_url_force_exchange: string[];
  is_blacklisted_in_scanner: boolean;
  ticker_title: string;
  instrument_name: string;
  medium_logo_urls: string[];
  logo: tv.logo_t;
  logo_id: string;
  currency_logo_id: string;
  country: string;
  currency: currency_t;
  currency_id: currency_t;
  fundamental_currency_code: currency_t;
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
  fund_view_modes: tv.fund_view_modes_t;
  source2: tv.source2_t;
  currency_code: string;
  measure: string;
  ast_business_description: tv.ast_business_description_t;
  sector: string;
  sector_url: string;
  industry: string;
  industry_url: string;
  isin_displayed: string;
  figi: tv.figi_t;
  number_of_employees_fy_h: number[];
  first_bar_time_1d: number;
  short_description: string;
  trade: tv.trade_t;
  is_dex_symbol: boolean;
  daily_bar: tv.daily_bar_t;
} & tv.tv_data<T>;
type meta_data_t = {
  asset_industry: string;
  asset_sector: string;
  asset?: asset_t;
  dividend?: dividend_t;
  company?: company_t;
  employees?: employees_t;
  fund?: fund_t;
};


type tv_data_raw_t = [i_id_t, tv_data_t | undefined, string | undefined];
*/
