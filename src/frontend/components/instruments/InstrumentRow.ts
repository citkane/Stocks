import { AppElement } from "@frontend/components/AppElement.ts";

export class InstrumentRow extends AppElement {
  static observedAttributes = ["data-all", "data-filter", "state_info"];

  constructor() {
    super();
    //this.api.set_topic(this);
    this.dom.template_to_self("instrmnt-row");
    this.setAttribute("shown", "");

    this.props.watch("data-all", this.handlers.render);
    this.props.watch("data-filter", this.handlers.filter);
    this.props.watch("state_info", this.handlers.info_drawer);
  }

  private handlers = {
    render: async (p: p.prop_callback) => {
      if (p.old === p.new) return;

      const transctns_id = util.hash_id(this.transctns);
      this.positions_root.setAttribute("i_id", this.i_id);
      this.positions_root.setAttribute("data-transctns", transctns_id);
      this.pos_button.innerHTML = this.pos_count;
      this.ticker_button.innerHTML = this.instrmnt.ticker;
      this.props.set_values();

      if (!!p.old) return;

      this.dom.make_description();
      this.dom.make_info();
      this.pos_button.addEventListener("click", this.handlers.drawer);
      this.pos_button.addEventListener("contextmenu", this.handlers.drawers);
      this.ticker_button.addEventListener("click", this.handlers.drawer);
      this.ticker_button.addEventListener("contextmenu", this.handlers.drawers);
    },
    filter: (p: p.prop_callback) => {
      if (p.old === p.new) return;

      this.positions_root.setAttribute("data-filter", p.new);
      this.props.set_values();
      this.pos_button.innerHTML = this.pos_count;
      const { search } = this.filter;
      if (search) {
        const description = this.instrmnt.description.toLowerCase();
        const ticker = this.instrmnt.ticker.toLowerCase();
        const about = this.instrmnt.about_instrmnt?.toLowerCase();
        const found =
          ticker.includes(search) ||
          description.includes(search) ||
          about?.includes(search);

        return found ? this.props.show() : this.props.hide();
      }
      Number(this.pos_count) ? this.props.show() : this.props.hide();
    },
    drawer: (e: Event) => {
      const name = (e.target! as HTMLElement).parentElement!.getAttribute(
        "name",
      )!;
      let state;
      switch (name) {
        case "ticker":
          state = this.info_drawer.getAttribute("state")!;
          state = state === "open" ? "closed" : "open";
          this.instrmnt_chart.setAttribute("i_id", this.i_id);
          this.info_drawer.setAttribute("state", state);
          break;
        case "positions":
          state = this.pos_drawer.getAttribute("state")!;
          state = state === "open" ? "closed" : "open";
          this.pos_drawer.setAttribute("state", state);
      }
    },
    drawers: (e: Event) => {
      e.preventDefault();
      let state: string;
      let tos: NodeJS.Timeout[];
      const name = (e.target! as HTMLElement).parentElement!.getAttribute(
        "name",
      )!;
      switch (name) {
        case "positions":
          state = this.pos_drawer.getAttribute("state")!;
          state = state === "open" ? "closed" : "open";
          tos = this.handlers.drawers_to.pos;
          while (tos.length) clearTimeout(tos.pop());

          this.pos_drawers.forEach((drawer, i) =>
            tos.push(setTimeout(() => drawer.setAttribute("state", state), i)),
          );
      }
    },
    drawers_to: { tick: [] as NodeJS.Timeout[], pos: [] as NodeJS.Timeout[] },
    info_drawer: (p: p.prop_callback) => {
      const state = this.info_drawer.getAttribute("state")!;
      if (state === p.new || this.ticker_button.disabled) return;

      this.instrmnt_chart.setAttribute("i_id", this.i_id);
      this.info_drawer.setAttribute("state", p.new);
      if (p.new === "closed") return;

      //this.dom.make_live_data(p.new);
    },
  };
  private props = this.api.props({
    set_values: () => {
      let values: any = this.money.collect_keys.reduce(
        (c, key) => {
          const value = this.positions_root.getAttribute(key);
          if (!value) return c;
          c[key] = Number(value);
          return c;
        },
        {} as { [key: string]: number },
      );
      values.div_yield = !values.market_value
        ? 0
        : this.instrmnt.div_yield || 0;
      values.div_est = util.money.div_est(
        values.market_value,
        values.div_yield,
      );
      const { traded_value, market_value } = values;
      const { description, ticker, asset_sector, asset_industry } =
        this.instrmnt;
      values.percent_pl = util.money.percent_pl(traded_value!, market_value!);
      values.positions = this.pos_count;
      Object.keys(values).forEach((key) => {
        const val = String(values[key]);
        this.setAttribute(key, val);
        const el = this.querySelector(`[name="${key}"]`);
        el?.setAttribute("value", val);
      });
      this.setAttribute("description", description);
      this.setAttribute("ticker", ticker);
      if (asset_sector) this.setAttribute("asset_sector", asset_sector);
      if (asset_industry) this.setAttribute("asset_industry", asset_industry);
    },
  });
  private dom = this.api.dom({
    make_description: () => {
      const { svg_string, description } = this.instrmnt;
      const url = this.tv_url;
      const logo = !svg_string
        ? this.dom.make_el("span", "!", 'class="no_logo"')
        : new DOMParser().parseFromString(svg_string, "image/svg+xml")
            .documentElement;
      if (url) {
        this.description_el.setAttribute("href", url);
        this.description_el.setAttribute("target", "blank");
      } else {
        this.description_el.classList.add("no_link");
      }
      this.description_el.querySelector("span")!.innerHTML = description;
      this.description_el.parentElement!.prepend(logo);
    },
    make_info: () => {
      let { about_instrmnt, asset_industry, asset_sector, currency } =
        this.instrmnt;
      if (!about_instrmnt) {
        this.ticker_button.disabled = true;
        return;
      }
      this.info_bcrumb.querySelector(".sector")!.innerHTML = asset_sector!;
      this.info_bcrumb.querySelector(".industry")!.innerHTML = asset_industry!;

      this.info_currency.innerHTML = currency;
      const about = util.string.p_html(about_instrmnt || "");
      this.about_company.innerHTML = about;
    },
  });

  private get instrmnt() {
    return this.cache.get.instrument(this.i_id);
  }
  private get transctns() {
    return this.cache.get.transactions(this.i_id);
  }

  private get ticker_button() {
    return this.querySelector("[name=ticker] button")! as HTMLButtonElement;
  }
  private get pos_button() {
    return this.querySelector("[name=positions] button")!;
  }
  private get pos_count() {
    return this.positions_root.getAttribute("position_count")!;
  }
  private get pos_drawer(): HTMLElement {
    return this.querySelector('expanding-drawer[name="positions_drawer"]')!;
  }
  private get pos_drawers() {
    return this.instrmnt_rows_below.map(
      (r) => r.querySelector('[name="positions_drawer"]')!,
    );
  }
  private get positions_root(): HTMLElement {
    return this.querySelector("positions-root")!;
  }
  private get instrmnt_chart(): HTMLElement {
    return this.querySelector("instrmnt-chart")!;
  }
  private get instrmnt_rows_below() {
    const q = "instrmnt-row:not([hidden]";
    const rows = [...this.root_instrmnts_el.querySelectorAll(q)!];
    let index: number;
    rows.some((r, i) => {
      index = i;
      return r.getAttribute("i_id") === this.instrmnt.i_id;
    });
    return rows.slice(index!);
  }
  private get info_drawer(): HTMLElement {
    return this.querySelector('expanding-drawer[name="info_drawer"]')!;
  }
  private get info_bcrumb() {
    return this.info_drawer.querySelector(`[name="header"] .breadcrumb`)!;
  }
  private get info_currency() {
    return this.info_drawer.querySelector(`[name="header"] .currency`)!;
  }
  private get about_company() {
    return this.info_drawer.querySelector('[name="about_company"]')!;
  }
  private get description_el() {
    return this.querySelector(`[name="description"] a`)!;
  }
  private get tv_url() {
    if (!this.instrmnt.about_instrmnt) return undefined;
    return `https://www.tradingview.com/symbols/${this.instrmnt.i_id}`;
  }
}
