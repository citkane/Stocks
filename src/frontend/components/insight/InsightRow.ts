import { WebComponent } from "@frontend/components/WebComponent";
import type { MoneyString, PercentString } from "@frontend/components";

export class InsightRow extends WebComponent {
  static observedAttributes = ["data"];

  constructor() {
    super();
    this.dom.template_to_self("insight-row");
    this.dom.define_selectors();
    this.props.watch("data", this.handlers.render);
  }

  private handlers = {
    render: (p: p.prop_callback) => {
      if (p.old === p.new) return;

      this.percent = this.data.percent_width();
      this.dom.apply_data();

      this.el_grid.onclick = this.handlers.filter;
      this.el_topic.onclick = this.handlers.wiki;
    },
    filter: (e: Event) => {
      this.router.navigate("/portfolio");
      this.filter.set(this.row_data.filter);
    },
    wiki: (e: Event) => {
      e.stopPropagation();
    },
  };
  private dom = this.api.dom({
    apply_data: () => {
      const { topic, market_value, u_pl_perc, location_link } = this.row_data;
      this.el_value.money_value = market_value;
      this.el_u_pl.value = u_pl_perc;
      this.el_percent_bar.setAttribute("pl", u_pl_perc > 0 ? "profit" : "loss");
      this.el_topic.innerText = topic;
      if (location_link) this.el_topic.href = `${location_link}#Economy`;

      setTimeout(() => {
        this.el_percent_value.innerText = this.dom.percent_string();
      });
    },
    define_selectors: () => {
      this.el_grid = this.querySelector(".grid")!;
      this.el_topic = this.querySelector('[name="topic"] a')!;
      this.el_value = this.querySelector('[name="value"]')!;
      this.el_u_pl = this.querySelector('[name="u_pl"]')!;
      this.el_percent_value = this.querySelector('[name="percent"] .value')!;
      this.el_percent_bar = this.querySelector('[name="percent"] .bar')!;
      this._el_children = this.querySelector(".children")!;
    },
    percent_string: () => {
      const percent = Math.round(this.percent * 100) / 100;
      const name = this.parent?.row_data.topic || this.name;
      return `${percent}% of ${name}`;
    },
  });
  private props = this.api.props({});
  private data = this.api.data({
    percent_width: () => {
      const { root_value, market_value } = this.row_data;
      return (market_value / root_value) * 100;
    },
  });

  public set_width = (parent_percent = 100) => {
    let { percent, rel_percent } = this;
    const scale_factor = 100 / rel_percent;
    percent = percent * scale_factor;
    percent = (percent * parent_percent) / 100;
    this.el_percent_bar.style.width = `${percent}%`;

    this.els_row.forEach((el_row) => el_row.set_width(percent));
  };
  public set_level = (level: number) => {
    this.setAttribute("level", String(level));
  };

  public set row_data(data: f.insight_row_data_t) {
    this._data = data;
    const data_hash = util.hash_id(data);
    this.setAttribute("data", data_hash);
  }
  public get row_data() {
    return this._data;
  }
  public get el_rows_container() {
    return this._el_children;
  }
  public get els_row() {
    return this.el_rows_container.querySelectorAll<InsightRow>(
      "&> insight-row",
    );
  }
  private get name() {
    return this.getAttribute("name")!;
  }

  public parent?: InsightRow;
  public percent = 0;
  public rel_percent = 0;
  private el_topic!: HTMLAnchorElement;
  private el_grid!: HTMLElement;
  private el_value!: MoneyString;
  private el_u_pl!: PercentString;
  private el_percent_value!: HTMLElement;
  private el_percent_bar!: HTMLElement;
  private _el_children!: HTMLElement;

  private _data!: f.insight_row_data_t;
}
