import { WebComponent } from "@frontend/components/WebComponent";
import type {
  ExpandingDrawer,
  PositionsRoot,
  InstrumentChart,
} from "@frontend/components";

export class InstrumentRow extends WebComponent {
  static observedAttributes = ["data-all", "data-filter"];

  constructor() {
    super();
    this.dom.template_to_self("instrmnt-row");
    this.props.show();
    this.dom.query_select();
    this.props.watch("data-all", this.handlers.render);
    this.props.watch("data-filter", this.handlers.filter);
    this.el_button_ticker.oncontextmenu = this.handlers.drawers;
    this.el_button_pos.oncontextmenu = this.handlers.drawers;
    this.el_button_pos.onclick = this.handlers.drawer;
    this.el_button_ticker.onclick = this.handlers.drawer;
  }

  private handlers = {
    render: async (p: p.prop_callback) => {
      if (p.old === p.new) return;

      if (!p.old) this.el_root_pos.setAttribute("i_id", this.i_id);
      const transctns_id = util.hash_id(this.transctns);
      this.el_root_pos.setAttribute("data-transctns", transctns_id);
      this.el_button_pos.innerHTML = String(this.pos_count);
      this.props.set_money();
      this.props.update();
      if (!!p.old) return;

      this.dom.init();
      this.dom.init_info();
      this.props.init();
    },
    filter: (p: p.prop_callback) => {
      if (p.old === p.new) return;

      this.el_root_pos.setAttribute("data-filter", p.new);
      this.props.set_money();
      this.props.update();
      this.el_button_pos.innerHTML = String(this.pos_count);

      const { search } = this.cache.filter;
      if (search) return this.handlers.search(search);

      this.pos_count ? this.props.show() : this.props.hide();
    },
    search: (search: string) => {
      const description = this.instrmnt.description.toLowerCase();
      const ticker = this.instrmnt.ticker.toLowerCase();
      const about = this.instrmnt.about_instrmnt?.toLowerCase();
      const found =
        ticker.includes(search) ||
        description.includes(search) ||
        about?.includes(search);
      found ? this.props.show() : this.props.hide();
    },
    drawer: (e: Event) => {
      const button = (e.target! as HTMLElement).parentElement!;
      const name = button.getAttribute("name")!;
      switch (name) {
        case "ticker":
          this.el_chart_instrmnt.setAttribute("init", "true");
          this.el_drawer_info.toggle();
          break;
        case "positions":
          this.el_drawer_pos.toggle();
      }
    },
    drawers: (e: Event) => {
      e.preventDefault();
      let state: string;
      const { pos, info } = this.drawer_time_outs;
      const button = (e.target! as HTMLElement).parentElement!;
      const name = button.getAttribute("name")!;
      switch (name) {
        case "ticker":
          state = this.el_drawer_info.getAttribute("state")!;
          state = state === "open" ? "closed" : "open";
          while (info.length) clearTimeout(info.pop());
          const fn = (drawer: ExpandingDrawer) => {
            const chart = drawer.querySelector("instrmnt-chart")!;
            chart.toggleAttribute("init");
            drawer.setAttribute("state", state);
          };
          const info_drawers = this.dom.els_below_drawer("info");
          info_drawers.forEach((drawer, i) => {
            info.push(setTimeout(() => fn(drawer), i));
          });
          break;
        case "positions":
          state = this.el_drawer_pos.getAttribute("state")!;
          state = state === "open" ? "closed" : "open";
          while (pos.length) clearTimeout(pos.pop());
          const pos_drawers = this.dom.els_below_drawer("pos");
          pos_drawers.forEach((drawer, i) =>
            pos.push(setTimeout(() => drawer.setAttribute("state", state), i)),
          );
          break;
      }
    },
  };
  private props = this.api.props({
    init: () => {
      const { description, ticker, country, place } = this.instrmnt;
      this.setAttribute("description", description);
      this.setAttribute("ticker", ticker);
      if (country) this.setAttribute("country", country);
      if (place) this.setAttribute("place", place);
    },
    update: () => {
      this.setAttribute("positions", String(this.pos_count));
      Object.values(this.els_money).forEach((el) => {
        const name = el.getAttribute("name")!;
        const val = el.getAttribute("value")!;
        this.setAttribute(name, val);
      });
    },
    set_money: () => {
      this.money.instruments.assign(
        this.els_money,
        this.el_root_pos.tally,
        this.instrmnt,
      );
    },
  });
  private dom = this.api.dom({
    init: () => {
      const { svg_logo, description, ticker, asset_sector, asset_industry } =
        this.instrmnt;
      const url = this.tv_url;
      const logo = !svg_logo
        ? this.dom.make_el("span", "!", 'class="no_logo"')
        : new DOMParser().parseFromString(svg_logo, "image/svg+xml")
            .documentElement;
      if (url) {
        this.el_description.setAttribute("href", url);
        this.el_description.setAttribute("target", "blank");
      } else {
        this.el_description.classList.add("no_link");
      }
      if (asset_sector) this.setAttribute("asset_sector", asset_sector);
      if (asset_industry) this.setAttribute("asset_industry", asset_industry);
      this.el_description.querySelector("span")!.innerHTML = description;
      this.el_description.parentElement!.prepend(logo);
      this.el_button_ticker.innerHTML = ticker;
    },
    init_info: () => {
      const { about_instrmnt, asset_industry, asset_sector, currency } =
        this.instrmnt;
      if (!about_instrmnt) {
        this.el_button_ticker.disabled = true;
        return;
      }
      this.el_info_sector.innerHTML = asset_sector || "unknown";
      this.el_info_industry.innerHTML = asset_industry || "unknown";
      this.el_info_currency.innerHTML = currency;
      const about = util.string.p_html(about_instrmnt || "No Information");
      this.el_about_instmnt.innerHTML = about;
      const sector_filter = { asset_sector, asset_industry: "all" };
      const industry_filter = { asset_sector, asset_industry };
      this.el_info_sector.onclick = () => this.filter.set(sector_filter);
      this.el_info_industry.onclick = () => this.filter.set(industry_filter);
    },
    query_select: () => {
      const q_ed = (query: string) => this.qs<ExpandingDrawer>(query);
      const q_e = (query: string) => this.qs<HTMLElement>(query);
      const q_b = (query: string) => this.qs<HTMLButtonElement>(query);
      const q_pr = (query: string) => this.qs<PositionsRoot>(query);
      const q_ic = (query: string) => this.qs<InstrumentChart>(query);
      const q_ae = (query: string) => this.qs<HTMLAnchorElement>(query);

      this.el_drawer_info = q_ed('expanding-drawer[name="info_drawer"]')!;
      this.i_qs = this.el_drawer_info.querySelector;
      const iq_e = (query: string) => this.i_qs<HTMLElement>(query);

      this.el_button_ticker = q_b("[name=ticker] button")!;
      this.el_button_pos = q_b("[name=positions] button")!;
      this.el_drawer_pos = q_ed('expanding-drawer[name="positions_drawer"]')!;
      this.el_instrument = q_e(`.grid.instrument`)!;
      this.el_info_sector = iq_e(`[name="header"] .breadcrumb .sector`)!;
      this.el_info_industry = iq_e(`[name="header"] .breadcrumb .industry`)!;
      this.el_info_currency = iq_e(`[name="header"] .currency`)!;
      this.el_about_instmnt = iq_e('[name="about_company"]')!;
      this.el_root_pos = q_pr("positions-root")!;
      this.el_chart_instrmnt = q_ic("instrmnt-chart")!;
      this.el_description = q_ae(`[name="description"] a`)!;
      this.els_money = this.selector.money.instruments(this.el_instrument);
    },
    els_below_drawer: (kind: "pos" | "info") => {
      let index: number;
      this.selector.filter.shown_instrmnts_reset();
      return this.selector.filter.shown_instrmnts().reduce((c, row, i) => {
        if (row.instrmnt.i_id === this.instrmnt.i_id) index = i;
        if (index === undefined) return c;
        c.push(row[`el_drawer_${kind}`]);
        return c;
      }, [] as ExpandingDrawer[]);
    },
  });

  public get instrmnt() {
    return this.cache.get.instrument(this.i_id);
  }
  private get transctns() {
    return this.cache.get.transactions(this.i_id);
  }
  private get tv_url() {
    if (!this.instrmnt.about_instrmnt) return undefined;
    return `https://www.tradingview.com/symbols/${this.instrmnt.i_id}`;
  }
  private get pos_count() {
    return this.el_root_pos.transctn_display_count;
  }

  public els_money!: f.money_instruments_t;
  private el_root_pos!: PositionsRoot;
  private el_button_ticker!: HTMLButtonElement;
  private el_button_pos!: HTMLButtonElement;
  private el_instrument!: HTMLElement;
  private el_chart_instrmnt!: InstrumentChart;
  private el_drawer_pos!: ExpandingDrawer;
  private el_drawer_info!: ExpandingDrawer;
  private el_info_sector!: HTMLElement;
  private el_info_industry!: HTMLElement;
  private el_info_currency!: HTMLElement;
  private el_about_instmnt!: HTMLElement;
  private el_description!: HTMLAnchorElement;

  private qs = this.querySelector;
  private i_qs!: typeof this.qs;
  private drawer_time_outs = {
    pos: [] as NodeJS.Timeout[],
    info: [] as NodeJS.Timeout[],
  };
}
