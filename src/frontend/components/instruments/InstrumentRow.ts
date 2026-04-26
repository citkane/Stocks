import { AppElement } from "@frontend/components/AppElement.ts";
import { Trading_View as TV } from "@common/index";

const logo_size = 32;

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

      delete this._data_all;
      const transctns_string = util.html.json_stringify(this.transctns);
      const instrmnt_string = util.html.json_stringify(this.instrmnt);

      this.instrmnt_chart.setAttribute("data-instrmnt", instrmnt_string);
      this.positions_root.setAttribute("data-transctns", transctns_string);
      this.instrmnt_chart.setAttribute("data-transctns", transctns_string);

      //const is_partial = this.data.needs_tv_static();

      this.dom.make_description();
      this.dom.make_info();

      this.pos_button.innerHTML = this.pos_count;
      this.ticker_button.innerHTML = this.instrmnt.ticker;
      this.pos_button.addEventListener("click", this.handlers.drawer);
      this.pos_button.addEventListener("contextmenu", this.handlers.drawers);

      this.props.set_money_values();
      this.props.set_instrmnt_data();

      //if (is_partial) {
      //  this.data.update_tv_static();
      //  this.ticker_button.setAttribute("disabled", "");
      //  return;
      //}
      this.ticker_button.removeAttribute("disabled");
      this.ticker_button.addEventListener("click", this.handlers.drawer);
      this.ticker_button.addEventListener("contextmenu", this.handlers.drawers);
    },
    filter: (p: p.prop_callback) => {
      if (p.old === p.new) return;

      this.positions_root.setAttribute("filter", p.new);
      this.props.set_money_values();
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
          this.instrmnt_chart.setAttribute("ticker", this.ticker);
          this.info_drawer.setAttribute("state", state);
          //this.dom.make_live_data(state);
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

      this.instrmnt_chart.setAttribute("ticker", this.ticker);
      this.info_drawer.setAttribute("state", p.new);
      if (p.new === "closed") return;

      //this.dom.make_live_data(p.new);
    },
  };
  private props = this.api.props({
    set_money_values: () => {
      const values = this.money_keys.reduce(
        (c, key) => {
          const value = this.positions_root.getAttribute(key)!;
          this.setAttribute(key, value);
          this.querySelector(`[name="${key}"]`)?.setAttribute("value", value);
          c[key] = Number(value);
          return c;
        },
        {} as { [key: string]: number },
      );
      const { traded_value, market_value } = values;
      const percent_pl = util.money.percent_pl(traded_value!, market_value!);

      this.setAttribute("percent_pl", String(percent_pl));
      this.querySelector(`[name="percent_pl"]`)?.setAttribute(
        "value",
        String(percent_pl),
      );
    },
    set_instrmnt_data: () => {
      Object.keys(this.instrmnt).forEach((key) => {
        const k = key as keyof typeof this.instrmnt;
        if (typeof this.instrmnt[k] === "object") return;
        this.setAttribute(key, this.instrmnt[k] || "");
      });
      this.setAttribute("positions", this.pos_count);
    },
  });
  private dom = this.api.dom({
    make_description: () => {
      const logo = !this.instrmnt.svg_string
        ? this.dom.make_el("span", "!", 'class="no_logo"')
        : TV.to_svg_logo(this.instrmnt.svg_string!, logo_size);

      const desc_link = this.dom.make_el(
        "a",
        this.instrmnt.description,
        //!this.tv_url ? "" : `href="${this.tv_url}"`,
        //!this.tv_url ? "" : `target="blank"`,
        //!this.tv_url ? 'class="no_link"' : "",
      );

      this.description_element.innerHTML = "";
      this.description_element.appendChild(logo);
      this.description_element.appendChild(desc_link);
    },
    make_info: () => {
      //if (is_partial) return;

      const { about_company, asset_industry, asset_sector } = this.instrmnt;

      this.info_breadcrumb.innerHTML = `${asset_sector} | ${asset_industry}`;
      const _about = util.string.p_html(about_company || "");
      const about = this.dom.make_el("div", _about, 'class="about"');
      this.about_company.appendChild(about);
    },
    //make_live_data: async (open: string) => {
    //  if (open !== "open") return;
    //
    //  const data = await this.tv_dynamic;
    //  const sections: HTMLElement[] = [];
    //
    //  Object.keys(data).forEach((key) => {
    //    const vals = data[key as keyof typeof data];
    //    if (!vals) return;
    //
    //    const section = this.dom.make_el("div", "", 'class="section"');
    //    const _title = util.string.title_case(key.split("_").join(" "));
    //    const title = this.dom.make_el("span", _title, 'class="title"');
    //    section.appendChild(title);
    //
    //    this.live_data.innerHTML = "";
    //    Object.keys(vals).forEach((_title) => {
    //      const _fragments = vals[_title];
    //      if (!_fragments || _title === "Sector" || _title === "Industry")
    //        return;
    //      const wrapper = this.dom.make_el("div", "", 'class="snippet"');
    //      const snippt = this.dom.make_el("span", _title, 'class="title"');
    //      wrapper.appendChild(snippt);
    //
    //      const _val = _fragments.join(" ");
    //      const val = this.dom.make_el("span", _val, 'class="val"');
    //      wrapper.appendChild(val);
    //      section.appendChild(wrapper);
    //    });
    //    sections.push(section);
    //  });
    //  sections.forEach((child) => this.live_data.appendChild(child));
    //  this.info_drawer.setAttribute("height", "update");
    //},
  });
  //private data = this.api.data({
  //  fetch_html: (url: string) => {
  //    return this.messenger
  //      .request<string>("link_html", url)
  //      .catch((err: message_t) => {
  //        console.error(err.data);
  //      });
  //  },
  //  needs_tv_static: () => {
  //    const { asset_class, asset_industry, asset_sector, about_company } =
  //      this.instrmnt;
  //    return !asset_class || !asset_industry || !asset_sector || !about_company;
  //  },
  //  update_tv_static: async () => {
  //    const tv = await this.tv;
  //    if (!tv) return;
  //
  //    const svg_string = await this.data.fetch_html(tv.logo_url);
  //    const { asset_class, asset_sector, asset_industry, about_company } = tv;
  //    const static_data = {
  //      asset_class,
  //      asset_sector,
  //      asset_industry,
  //      about_company,
  //    } as instrmnt_t;
  //    if (!!svg_string) static_data.svg_string = svg_string;
  //
  //    const instrmnt = {
  //      ...this.instrmnt,
  //      ...static_data,
  //    };
  //    await this.messenger.request("save_instrument", instrmnt);
  //    this.setAttribute(
  //      "data-all",
  //      util.string.html_json({
  //        transactions: this.transctns,
  //        instrument: instrmnt,
  //      }),
  //    );
  //  },
  //});

  private get data_all() {
    if (this._data_all) return this._data_all!;
    const data = util.html.json_parse<data_all_t>(this.dataset.all!);
    return (this._data_all = data);
  }
  private get instrmnt() {
    return this.data_all.instrument;
  }
  private get transctns() {
    return this.data_all.transactions;
  }
  private get ticker() {
    return this.instrmnt.ticker;
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
  private get live_data() {
    return this.info_drawer.querySelector('[name="live_data"]')!;
  }

  private get description_element() {
    return this.dom.named_el("description");
  }
  //private get tv_url() {
  //  return TV.link(this.instrmnt);
  //}
  //private get tv() {
  //  if (this._tv)
  //    return Promise.resolve(
  //      this._tv === "noop" ? undefined : (this._tv as TV),
  //    );
  //  return this.data
  //    .fetch_html(this.tv_url)
  //    .then((html) => {
  //      if (!html) throw Error();
  //      return (this._tv = new TV(html));
  //    })
  //    .catch((_err) => {
  //      this._tv = "noop";
  //      return undefined;
  //    });
  //}
  //private get tv_dynamic() {
  //  if (this._tv_dynamic) return Promise.resolve(this._tv_dynamic);
  //  return this.tv.then((tv) => {
  //    if (!tv) return {};
  //    const { company_employees, company_info, earnings, key_stats } = tv;
  //    return (this._tv_dynamic = {
  //      company_employees,
  //      company_info,
  //      earnings,
  //      key_stats,
  //    });
  //  });
  //}

  private _data_all?: data_all_t;
  //private _tv?: TV | string;
  //private _tv_dynamic?: { [key: string]: f.tv_list_t | undefined };
}

type data_all_t = { instrument: instrmnt_t; transactions: transctn_t[] };
