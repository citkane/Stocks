import { AppElement } from "@frontend/components/AppElement.ts";

export class InstrumentRow extends AppElement {
  static observedAttributes = ["data-all", "filter", "state_info"];

  constructor() {
    super();
    this.api.set_topic(this);
    this.dom.template_to_self("instrmnt-row");

    this.props.watch("data-all", this.handlers.render);
    this.props.watch("filter", this.handlers.filter);
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
      this.ticker_button.removeAttribute("disabled");
      this.ticker_button.addEventListener("click", this.handlers.drawer);
      this.ticker_button.addEventListener("contextmenu", this.handlers.drawers);
    },
    filter: (p: p.prop_callback) => {
      if (p.old === p.new) return;

      this.positions_root.setAttribute("filter", p.new);
      this.props.set_values();
      this.pos_button.innerHTML = this.pos_count;
      Number(this.pos_count) ? this.props.show() : this.props.hide();
    },
    drawer: (e: Event) => {
      const name = (e.target as HTMLElement).getAttribute("name")!;
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
      const name = (e.target as HTMLElement).getAttribute("name")!;
      switch (name) {
        case "ticker":
          state = this.info_drawer.getAttribute("state")!;
          state = state === "open" ? "closed" : "open";
          tos = this.handlers.drawers_to.tick;
          while (tos.length) clearTimeout(tos.pop());

          this.instrmnt_rows_below.forEach((row, i) =>
            tos.push(
              setTimeout(() => row.setAttribute("state_info", state), i),
            ),
          );
          break;
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
      values.percent_pl = util.money.percent_pl(traded_value!, market_value!);
      values.positions = this.pos_count;
      values = { ...this.instrmnt, ...values };
      Object.keys(values).forEach((key) => {
        const val = String(values[key]);
        this.setAttribute(key, val);
        const el = this.querySelector(`[name="${key}"]`);
        el?.setAttribute("value", val);
      });
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

      const desc_link = this.dom.make_el(
        "a",
        description,
        !url ? "" : `href="${url}"`,
        !url ? "" : `target="blank"`,
        !url ? 'class="no_link"' : "",
      );

      this.description_element.innerHTML = "";
      this.description_element.appendChild(logo);
      this.description_element.appendChild(desc_link);
    },
    make_info: () => {
      const { about_instrmnt, asset_industry, asset_sector } = this.instrmnt;
      this.info_breadcrumb.innerHTML = `${asset_sector} | ${asset_industry}`;
      const _about = util.string.p_html(about_instrmnt || "");
      const about = this.dom.make_el("div", _about, 'class="about"');
      this.about_company.appendChild(about);
    },
  });

  private get instrmnt() {
    return this.cache.get.instrument(this.i_id);
  }
  private get transctns() {
    return this.cache.get.transactions(this.i_id);
  }

  private get ticker_button() {
    return this.querySelector("button[name=ticker]")! as HTMLButtonElement;
  }
  private get pos_count() {
    return this.positions_root.getAttribute("position_count")!;
  }
  private get pos_button() {
    return this.querySelector("button[name=positions]")!;
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
    const q = "instrmnt-row:not([display=none]";
    const rows = [...this.root_instrmnts.querySelectorAll(q)!];
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
  private get info_breadcrumb() {
    return this.info_drawer.querySelector('[name="breadcrumb"]')!;
  }
  private get about_company() {
    return this.info_drawer.querySelector('[name="about_company"]')!;
  }

  private get description_element() {
    return this.dom.named_el("description");
  }
  private get tv_url() {
    if (!this.instrmnt.about_instrmnt) return undefined;
    return `https://www.tradingview.com/symbols/${this.instrmnt.i_id}`;
  }
}
