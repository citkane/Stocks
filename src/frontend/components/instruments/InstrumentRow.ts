import { WebComponent } from "@frontend/components/WebComponent";
import {
  InstrumentsRoot,
  MoneyString,
  PercentString,
  PositnsRoot,
  type ExpandingDrawer,
  type InstrumentChart,
} from "@frontend/components";

export class InstrumentRow extends WebComponent {
  static observedAttributes = ["id", "positn", "filter"];

  constructor() {
    super();
    this.dom.template_to_self("instrmnt-row");
    this.props.show();
    this.props.watch("id", this.handlers.render);
    this.props.watch("positn", this.handlers.positn);
    this.props.watch("filter", this.handlers.filter);
  }

  private handlers = {
    render: async (p: pr.prop_callback) => {
      if (p.old === p.new || p.old) return;

      // this.el_button_ticker.oncontextmenu = this.handlers.drawers;
      // this.el_button_pos.oncontextmenu = this.handlers.drawers;
      this.el.positn_root.set_pid(this.p_id, "positn_root");
      this.el.button_transctns.onclick = this.handlers.drawer;
      this.el.button_ticker.onclick = this.handlers.drawer;

      this.dom.init();
      this.dom.init_info();
    },
    positn: (p: pr.prop_callback) => {
      if (p.old === p.new) return;

      const { el, props } = this;
      el.positn_root.setAttribute("positn", p.new);
      props.update_values();
    },
    filter: (p: pr.prop_callback) => {
      if (p.old === p.new) return;

      const { cache, instrmnt, el, props } = this;
      const {
          asset_sector: sector,
          asset_industry: industry,
          country_qid,
          region_qid,
          place_qid,
        } = cache.filter,
        { a_id, broker } = cache.filter;

      let hide =
        (!!sector && instrmnt.asset_sector !== sector) ||
        (!!industry && instrmnt.asset_industry !== industry) ||
        (!!country_qid && instrmnt.geo.country_qid !== country_qid) ||
        (!!region_qid && instrmnt.geo.region_qid !== region_qid) ||
        (!!place_qid && instrmnt.geo.place_qid !== place_qid);

      const transctn_ids = el.positn_root.filter(hide, broker, a_id);
      hide = !transctn_ids.length;
      hide ? this.props.hide() : this.props.show();
      props.update_values(transctn_ids);
    },
    drawer: (e: Event) => {
      const { el } = this;
      const button = (e.target! as HTMLElement).parentElement!;
      const name = button.getAttribute("name")!;
      switch (name) {
        case "ticker":
          el.chart.setAttribute("init", "true");
          el.drawer_info.toggle();
          break;
        case "transctns":
          el.drawer_pos.toggle();
      }
    },
  };

  private dom = this.api.dom({
    init: () => {
      const { el, dom, values: sort_values } = this;
      const { svg_logo, description, ticker, asset_sector, asset_industry } =
        this.instrmnt;
      const url = this.tv_url;
      const logo = dom.make_logo(svg_logo);

      if (url) {
        el.description.setAttribute("href", url);
        el.description.setAttribute("target", "blank");
      } else {
        el.description.classList.add("no_link");
      }
      if (asset_sector) this.setAttribute("asset_sector", asset_sector);
      if (asset_industry) this.setAttribute("asset_industry", asset_industry);
      el.description.querySelector("span")!.innerHTML = description;
      el.description.parentElement!.prepend(logo);
      el.button_ticker.innerHTML = ticker;
      sort_values.description = description;
      sort_values.ticker = ticker;
    },
    init_info: () => {
      const { el } = this;
      const { about_instrmnt, asset_industry, asset_sector, currency } =
        this.instrmnt;
      if (!about_instrmnt) {
        this.el.button_ticker.disabled = true;
        return;
      }
      el.info_sector.innerHTML = asset_sector || "unknown";
      el.info_industry.innerHTML = asset_industry || "unknown";
      el.info_currency.innerHTML = currency;
      const about = util.string.p_html(about_instrmnt || "No Information");
      this.el.about_instrmnt.innerHTML = about;
      //  this.el_info_sector.onclick = () => this.filter.set(sector_filter);
      //  this.el_info_industry.onclick = () => this.filter.set(industry_filter);
    },
    make_logo: (svg_logo?: string) => {
      return !svg_logo
        ? this.dom.make_el("span", "!", 'class="no_logo"')
        : new DOMParser().parseFromString(svg_logo, "image/svg+xml")
            .documentElement;
    },
  });
  private props = this.api.props({
    update_values: (transctn_ids?: string[]) => {
      const { el, props } = this;
      const { div_yield } = this.positn;
      transctn_ids ??= el.positn_root.transctn_ids;
      props.sum_totals(transctn_ids);

      const {
        pl_ur,
        pl_r,
        pl_fx,
        market_value,
        traded_value,
        div_est,
        div_val,
      } = this.totals;
      const open = market_value && traded_value;
      const transctns = el.positn_root.transctn_ids.length;
      const pl_ur_perc = open
        ? ((market_value - traded_value) / market_value) * 100
        : 0;

      el.div_yield.value = div_yield;
      el.div_val.money_value = div_val;
      el.pl_fx.money_value = pl_fx;
      el.pl_r.money_value = pl_r;
      el.pl_ur.money_value = pl_ur;
      el.pl_ur_perc.value = pl_ur_perc;
      el.market_value.money_value = market_value;
      el.traded_value.money_value = traded_value;
      el.div_est.money_value = div_est;
      el.button_transctns.innerText = String(transctns);

      this.values = {
        ...this.values,
        ...this.totals,
        transctns,
        div_yield,
        pl_ur_perc,
      };
    },
    sum_totals: (transctn_ids?: string[]) => {
      const { transctns, div_yield } = this.positn;
      this.totals = transctns.reduce((values, t) => {
        const {
          id,
          pl_fx,
          div_value,
          pl_r,
          pl_ur,
          traded_value,
          market_value,
          state,
        } = t;
        if (transctn_ids && !transctn_ids.includes(id)) return values;

        values.pl_fx += pl_fx;
        values.div_val += state === "curr_year" ? div_value : 0;
        values.pl_r += pl_r;
        values.pl_ur += pl_ur;
        values.traded_value += traded_value;
        values.market_value += market_value;
        return values;
      }, InstrumentsRoot.empty_totals());

      this.totals.div_est = div_yield
        ? Math.round(this.totals.market_value * (div_yield / 100))
        : 0;
    },
  });
  private get instrmnt() {
    return this.cache.get.instrmnts()[this.p_id]!;
  }
  private get tv_url() {
    if (!this.instrmnt.about_instrmnt) return undefined;
    return `https://www.tradingview.com/symbols/${this.instrmnt.p_id}`;
  }
  private get positn() {
    return this.cache.get.positns()[this.p_id]!;
  }

  public values = {} as { [key: string]: string | number };
  public totals = InstrumentsRoot.empty_totals();

  private el = this.query.select<{
    button_ticker: HTMLButtonElement;
    button_transctns: HTMLButtonElement;
    positn_root: PositnsRoot;
    description: HTMLElement;
    about_instrmnt: HTMLElement;
    info_sector: HTMLElement;
    info_industry: HTMLElement;
    info_currency: HTMLElement;
    chart: InstrumentChart;
    drawer_pos: ExpandingDrawer;
    drawer_info: ExpandingDrawer;
    traded_value: MoneyString;
    market_value: MoneyString;
    pl_r: MoneyString;
    pl_ur: MoneyString;
    pl_fx: MoneyString;
    pl_ur_perc: PercentString;
    div_val: MoneyString;
    div_est: MoneyString;
    div_yield: PercentString;
  }>({
    button_ticker: ["qs", '[name="ticker"] button'],
    button_transctns: ["qs", '[name="transctns"] button'],
    positn_root: ["qs", "positns-root"],
    description: ["qs", `[name="description"] a`],
    about_instrmnt: ["qs", '[name="about_company"]'],
    info_sector: ["qs", ".header .sector"],
    info_industry: ["qs", ".header .industry"],
    info_currency: ["qs", ".header .currency"],
    chart: ["qs", "instrmnt-chart"],
    drawer_pos: ["qs", 'expanding-drawer[name="pos_drawer"]'],
    drawer_info: ["qs", 'expanding-drawer[name="info_drawer"]'],
    traded_value: ["qs", '.instrmnt [name="traded_value"]'],
    market_value: ["qs", '.instrmnt [name="market_value"]'],
    pl_r: ["qs", '.instrmnt [name="pl_r"]'],
    pl_ur: ["qs", '.instrmnt [name="pl_ur"]'],
    pl_fx: ["qs", '.instrmnt [name="pl_fx"]'],
    pl_ur_perc: ["qs", '.instrmnt [name="pl_ur_perc"]'],
    div_val: ["qs", '.instrmnt [name="div_val"]'],
    div_est: ["qs", '.instrmnt [name="div_est"]'],
    div_yield: ["qs", '.instrmnt [name="div_yield"]'],
  });
}
const self = InstrumentRow;
