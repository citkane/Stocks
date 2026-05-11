import { Util as util } from "@common/Util";

const logo_size = 32;
const tv_url = "https://www.tradingview.com/symbols";
const url = "about:blank";
const data_regex =
  /<script type="application\/prs.init-data\+json">(.*?)<\/script>/gs;

const wv = await new Bun.WebView();
await wv.navigate(url);

export class TradingView {
  public static close = () => {
    wv.close();
  };
  public instruments = (i_ids: i_id_t[]) => this.instrmnts.scrape(i_ids);
  public live_data = (postns: b.positn_t[]) => this.live(postns);

  private live = async (
    postns: b.positn_t[],
    //fx: fx_rates_t,
  ): Promise<live_data_t[]> => {
    const i_ids = postns.map((p) => p.i_id);
    const data = await this.html.scrape(i_ids);
    return data
      .map((_data, i) => {
        const [i_id, data] = _data;
        if (!data) return;

        const postn = postns[i]!;
        let { currency } = postn;
        currency = currency === "XXX" ? data.currency : currency;
        currency = currency === "CNY" ? "CNH" : currency;
        //const fx_market = fx[currency]!;
        const { price: price_market } = data.trade;
        const { dividends_yield: div_yield } = data;
        return { i_id, price_market, div_yield };
      })
      .filter((d) => !!d);
  };
  private html = {
    scrape: async (i_ids: i_id_t[]) => {
      const collect: [i_id_t, tv_data_t | undefined, string | undefined][] = [];
      const urls = i_ids.map((i_id) => [i_id, this.html.url(i_id)]);
      const htmls = await this.html.fetch(urls as [i_id_t, string][]);
      for (let i = 0; i < htmls.length; i++) {
        const [p_id, html] = htmls[i]!;
        const data = !!html ? this.html.parse(html) : undefined;
        collect.push([p_id, data, html]);
      }
      return collect;
    },
    parse: (html: string): tv_data_t => {
      const matches = [];
      let match;
      while ((match = data_regex.exec(html)) !== null) {
        matches.push(match[1]?.trim());
      }
      const jsons = matches.map((m) => JSON.parse(m!));
      const _data = jsons.find(
        (js) => js[Object.keys(js)[0]!]?.data?.symbol?.measure,
      );
      const data = !!_data && _data[Object.keys(_data)[0]!]?.data?.symbol;
      return data;
    },
    fetch: async (urls: [i_id_t, string][]) => {
      return await Promise.all(
        urls.map(async (pair) => {
          const [p_id, url] = pair;
          const html = await _fetch(url);
          return [p_id, html] as [i_id_t, string | undefined];
        }),
      );
      async function _fetch(url: string) {
        const html = await fetch(url).then((res) =>
          res.ok ? res.text() : undefined,
        );
        return !!html
          ? html.trim() //util.html.escape(html)
          : (logger.warn(`No data found for ${url}`) as undefined);
      }
    },
    url: (p_id: i_id_t, endpoint = "") => {
      return `${tv_url}/${p_id}/${endpoint}`;
    },
  };
  private instrmnts = {
    scrape: async (i_ids: i_id_t[]) => {
      const instrmnts: (instrmnt_t | i_id_t)[] = [];
      const _data = await this.html.scrape(i_ids);
      await this.tv_data.init_dom();
      for (let i = 0; i < _data.length; i++) {
        const [p_id, data, html] = _data[i]!;
        if (!data || !html) {
          instrmnts.push(i_ids[i]!);
          continue;
        }
        const instrmnt = await this.instrmnts.instrmnt(p_id, data, html);
        let svg = await fetch(instrmnt.svg_string!).then((svg) => svg.text());
        svg = svg.replace("<!-- by TradingView -->", "");
        svg = await this.tv_data.update_logo(util.html.escape(svg));
        instrmnt.svg_string = svg;
        instrmnts.push(instrmnt);
      }
      return instrmnts;
    },

    instrmnt: async (i_id: i_id_t, data: tv_data_t, html: string) => {
      let website: string,
        asset_sector: string,
        asset_industry: string,
        cfi: string | undefined = undefined,
        {
          type: asset_class,
          instrument_name: description,
          medium_logo_urls: _svg_string,
          ast_business_description: _about,
          short_name: ticker,
          exchange,
          currency,
          isin_displayed: isin,
          sector,
          industry,
        } = data;

      const svg_string = _svg_string[0]!;
      const about_instrmnt = _about.children[0]!;

      switch (asset_class) {
        case "fund":
          const { homepage } = data as tv_data_t<"fund">;
          const scraped_data = await this.tv_data.scrape(
            util.html.escape(html),
          );
          website = homepage;
          asset_sector = scraped_data.asset_sector;
          asset_industry = scraped_data.asset_industry;
          break;
        case "stock":
          const { web_site_url, cfi_code } = data as tv_data_t<"stock">;
          website = web_site_url;
          cfi = cfi_code;
          asset_sector = sector;
          asset_industry = industry;
          break;
      }
      const instrumnt = {
        i_id,
        ticker,
        exchange,
        currency,
        description,
        about_instrmnt,
        asset_class,
        asset_industry,
        asset_sector,
        isin,
        cfi,
        website,
        svg_string,
      };
      return Object.keys(instrumnt).reduce(
        (c, key) => {
          c[key] = instrumnt[key as keyof typeof instrumnt]?.trim();
          return c;
        },
        {} as { [key: string]: any },
      ) as instrmnt_t;
    },
  };
  private tv_data = {
    init: false,
    init_dom: async () => {
      if (this.tv_data.init) return;
      this.tv_data.init = true;
      const eval_str = `(() => {
        window.util = { html: { ${string_fns(util.html)} }};
        window.q = new class { query = { ${string_fns(this.query)} }};
    })()`;
      await wv.evaluate(eval_str);

      function string_fns(ob: Object): string {
        return Object.keys(ob).reduce((c, key) => {
          const k = key as keyof typeof ob;
          const val = ob[k];
          return (c += ` ${key}: ${val.toString()},`);
        }, "");
      }
    },
    scrape: async (html: string): Promise<meta_data_t> => {
      const str = `((html) => this.q.query.data(html))(${html})`;
      const data = await wv.evaluate<scrape_data_raw_t>(str);

      let { stats: _stats, asset_class } = data;
      const stats_fmted = _stats
        .filter((s) => s[1] !== "—")
        .map(this.tv_data.format_stat);

      const stats = this.tv_data.reduce_stats(stats_fmted);
      const { asset, fund } = stats;
      asset_class = asset_class?.split(" ")[0]!;
      const asset_sector = asset?.sector || asset_class;
      const asset_industry = asset?.industry || fund_indstry() || asset_class;
      const formatted_data = {
        asset_sector,
        asset_industry,
        ...stats,
      };

      return formatted_data;

      function fund_indstry() {
        if (!fund) return;
        const { category, niche, class: _class } = fund;
        if (!_class && !category && !niche) return;
        return [_class, category, niche].filter((cat) => !!cat).join("/");
      }
    },
    reduce_stats: (stats: raw_stat_t[]) =>
      stats.reduce((c, stat) => {
        let [title, val] = stat;
        const [sect, catg] = title.split("_");
        if (!catg) {
          c = { ...c, ...{ [sect!]: val } };
          return c;
        }
        (c as any)[sect!] = {
          ...((c as any)[sect!] || {}),
          ...{ [catg]: val },
        };
        return c;
      }, {} as stats_t),
    format_stat: (stat: raw_stat_t): raw_stat_t => {
      let [title, val] = stat;
      val = util.string.clean_unicode(val as string);
      title = title.replace(/Identifiers\w*/, "isin");
      switch (title) {
        case "Market capitalization":
          title = "asset_capitalisation";
          val = this.tv_data.number_val(val);
          break;
        case "Dividend yield (indicated)":
          title = "dividend_yield";
          val = this.tv_data.number_perc(val);
          break;
        case "Price to earnings Ratio (TTM)":
          title = "asset_pe";
          val = Number(val);
          break;
        case "Basic EPS (TTM)":
          title = "asset_eps";
          val = this.tv_data.number_val(val);
          break;
        case "Net income (FY)":
          title = "company_income";
          val = this.tv_data.number_val(val);
          break;
        case "Revenue (FY)":
          title = "company_revenue";
          val = this.tv_data.number_val(val);
          break;
        case "Shares float":
          title = "asset_shares";
          val = this.tv_data.number_val(val);
          break;
        case "Beta (1Y)":
          title = "asset_beta";
          val = Number(val);
          break;
        case "Employees (FY)":
          title = "employees_number";
          val = this.tv_data.number_val(val);
          break;
        case "Change (1Y)":
          title = "employees_change";
          val = val.split(" ");
          let amount: number, change: [number, string];
          if (val.length === 1) {
            amount = Number(val[0]);
            change = [0, "%"];
          } else if (val.length === 3) {
            amount = this.tv_data.number_val(`${val[0]} ${val[1]}`) as number;
            change = this.tv_data.number_perc(val[2] as string);
          } else {
            amount = Number(val[0]);
            change = this.tv_data.number_perc(val[1] as string);
          }
          val = [amount, ...change];
          break;
        case "Revenue / Employee (1Y)":
          title = "employees_revenue";
          val = this.tv_data.number_val(val);
          break;
        case "Net income / Employee (1Y)":
          title = "employees_income";
          val = this.tv_data.number_val(val);
          break;
        case "Sector":
          title = "asset_sector";
          break;
        case "Industry":
          title = "asset_industry";
          break;
        case "CEO":
          title = "company_ceo";
          break;
        case "Website":
          title = "website";
          break;
        case "Headquarters":
          title = "company_headquarters";
          break;
        case "Founded":
          title = "company_founded";
          break;
        case "IPO date":
          title = "asset_ipo";
          break;
        case "isin":
          val = val.split(" ")[1]!;
          break;
        case "Assets under management (AUM)":
          title = "fund_assets";
          val = this.tv_data.number_val(val);
          break;
        case "Fund flows (1Y)":
          title = "fund_flows";
          val = this.tv_data.number_val(val);
          break;
        case "Discount/Premium to NAV":
          title = "fund_nav";
          val = this.tv_data.number_perc(val);
          break;
        case "Shares outstanding":
          title = "fund_outstanding";
          val = this.tv_data.number_val(val);
          break;
        case "Expense ratio":
          title = "fund_ratio";
          val = this.tv_data.number_perc(val);
          break;
        case "Issuer":
          title = "fund_issuer";
          break;
        case "Brand":
          title = "fund_brand";
          break;
        case "Home page":
          title = "website";
          break;
        case "Inception date":
          title = "fund_inception";
          break;
        case "Structure":
          title = "fund_structure";
          break;
        case "Index tracked":
          title = "fund_index";
          break;
        case "Replication method":
          title = "fund_replication";
          break;
        case "Management style":
          title = "fund_style";
          break;
        case "Dividend treatment":
          title = "fund_dividend";
          break;
        case "Primary advisor":
          title = "fund_advisor";
          break;
        case "CFI code":
          title = "cfi";
          break;
        case "Asset Class":
          title = "fund_class";
          break;
        case "Category":
          title = "fund_category";
          break;
        case "Focus":
          title = "fund_focus";
          break;
        case "Niche":
          title = "fund_niche";
          break;
        case "Strategy":
          title = "fund_strategy";
          break;
        case "Geography":
          title = "fund_geography";
          break;
        case "Weighting scheme":
          title = "fund_weighting";
          break;
        case "Selection criteria":
          title = "fund_selection";
          break;
      }
      return [title, val];
    },
    update_logo: async (svg_str: string) => {
      const str = `((svg_string) => q.query.svg(svg_string, ${logo_size}))(${svg_str})`;
      return await wv.evaluate<string>(str);
    },
    number_val: (val: string) => {
      const multipliers = ["K", "M", "B", "T"];
      let _val: (string | number)[] = val.split(" ");
      _val[0] = Number(_val[0]);
      if (isNaN(_val[0])) return val;
      if (!multipliers.includes(_val[1] as string)) return _val;

      switch (_val[1]) {
        case "K":
          _val[0] = Math.round(_val[0] * 1000);
          break;
        case "M":
          _val[0] = Math.round(_val[0] * 1000000);
          break;
        case "B":
          _val[0] = Math.round(_val[0] * 1000000000);
          break;
        case "T":
          _val[0] = Math.round(_val[0] * 1000000000000);
          break;
      }
      _val.splice(1, 1);
      if (_val.length === 1) return _val[0];
      return _val;
    },
    number_perc: (val: string) => {
      const _val: (number | string)[] = val.split("%");
      _val[0] = Number(_val[0]);
      _val[1] = "%";
      return _val as [number, string];
    },
  };
  private query = {
    to_fragment: (html: string) => {
      const template = document.createElement("template");
      template.innerHTML = util.html.unescape(html);
      return template.content;
    },
    data: (html: string): scrape_data_raw_t => {
      const dom = this.query.to_fragment(html);
      return {
        asset_class: this.query.class(dom)!,
        stats: this.query.stats(dom),
      };
    },
    class: (dom: DocumentFragment) => {
      return dom.querySelector<HTMLElement>(
        `nav[class^="breadcrumbsContainer-"] li:nth-child(3) span[class^="breadcrumbContent-"]`,
      )?.innerText;
    },
    stats: (dom: DocumentFragment) => {
      return [
        ...dom.querySelectorAll('[class^="widgets-"] .block-ststB_hQ'),
      ].reduce((c, stat) => {
        let val: string;
        let label = sel(stat, ".label-ststB_hQ").innerText!;
        const is_url = label === "Home page" || label === "Website";
        val = is_url
          ? sel(stat, ".link-ststB_hQ").getAttribute("href")!
          : sel(stat, ".value-ststB_hQ").innerText!;
        c.push([label, val]);

        return c;
      }, [] as raw_stat_t[]);

      function sel(stat: Element, q: string) {
        return stat.querySelector(q)! as HTMLElement;
      }
    },
    svg: (svg_string: string, size: number) => {
      svg_string = util.html.unescape(svg_string);
      const logo = new DOMParser().parseFromString(
        svg_string,
        "image/svg+xml",
      ).documentElement;
      logo.setAttribute("viewBox", "0 0 18 18");
      //logo.setAttribute("width", String(size));
      //logo.setAttribute("height", String(size));
      return logo.outerHTML;
    },
  };
}

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
namespace tv {
  export type tv_data<T = "fund" | "stock"> = T extends "fund"
    ? tv_data_fund
    : T extends "stock"
      ? tv_data_stock
      : tv_data_fund & tv_data_stock;

  export type tv_data_fund = {
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
  };
  export type tv_data_stock = {
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
  };
  export type logo_t = {
    style: string;
    logoid: string;
  };
  export type ast_business_description_t = {
    type: string;
    children: string[];
  };
  export type primary_symbol_t = {
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
  export type issuer_stock_symbol_data_t = {
    short_description: string;
    logo_id: string;
    tv_symbol_page_url: string;
  };
  export type fund_view_modes_t = {
    traditional: string[];
  };
  export type source2_t = {
    country: string;
    description: string;
    "exchange-type": string;
    id: string;
    name: string;
    url: string;
  };
  export type figi_t = {
    "country-composite": string;
    "exchange-level": string;
  };
  export type trade_t = {
    price: number;
  };
  export type daily_bar_t = {
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
