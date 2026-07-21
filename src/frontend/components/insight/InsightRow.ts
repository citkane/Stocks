import { WebComponent } from "@frontend/components/WebComponent";
import {
  type InsightView,
  type data,
  type MoneyString,
  type PercentString,
} from "@frontend/components";

export class InsightRow extends WebComponent {
  static observedAttributes = ["sort"];

  constructor() {
    super();
    this.dom.template_to_self("insight-row");
    this.props.watch("sort", this.handlers.sort);
  }
  public init = (
    topic: string,
    instrmnts: id.p[],
    level: number,
    view: InsightView,
    parent?: InsightRow,
  ) => {
    const view_name = view.getAttribute("view")! as insight.view_name;
    this.view_name = view_name;
    this.setAttribute("view", view_name);
    this.setAttribute("level", String(level));
    this.level = level;
    this.tally = view.tally;
    this.parent = parent || view;
    this.view = view;
    this.instrmnts = instrmnts;
    this.topic = topic;
    this.topic_key = topic;
    this.totals = this.tally.empty();
    this.el.topic.onclick = this.handlers.navigate;
  };
  public append_child = (child: InsightRow) => {
    this.el.children.appendChild(child);
  };
  public calc_total = (parent_totals: data.tally) => {
    const { rows, tally, instrmnts } = this;
    this.totals = tally.empty();
    rows.length
      ? rows.forEach((row) => row.calc_total(this.totals))
      : tally.instrmnts(instrmnts, this.totals);

    tally.children([this.totals], parent_totals);
    tally.high_low(this.totals, parent_totals);
  };
  public render = (parent_width?: number) => {
    const { market_value, pl_ur_perc, pl_ur } = this.totals;
    const { el, topic, parent } = this;
    const { high } = parent.totals;
    let { rows } = this;

    el.topic.innerHTML = topic;
    el.value.money_value = market_value;
    el.pl_ur.money_value = pl_ur;
    el.pl_ur_perc.value = pl_ur_perc;

    const width = parent_width
      ? (market_value / high.market_value) * parent_width
      : (market_value / high.market_value) * 100;
    const percnt = (market_value / parent.totals.market_value) * 100;
    const info_percnt = `${Math.round(percnt * 100) / 100}%`;
    const info = `${info_percnt} of ${parent.topic_string} market value`;

    el.bar.style.width = `${width}%`;
    el.bar_value.innerHTML = info;
    this.width = width;

    rows.forEach((row) => row.render(this.width));
  };

  private props = this.api.props();
  private handlers = {
    sort: (p: pr.prop_callback) => {
      const { el, view, dom } = this;
      view.sort_rows(el.children);
      dom.bar_background(p.new as data.ctx);
    },
    navigate: () => {
      this.el.root_filter.set(this.filter);
      this.router.navigate("portfolio");
    },
  };
  private dom = this.api.dom({
    bar_background: (ctx: data.ctx) => {
      const { el, view, totals } = this;
      const { high, low } = view.totals;
      const base = totals[ctx];

      let opacity = 0;
      el.bar.style.backgroundColor = "";
      ctx === "market_value"
        ? el.bar.removeAttribute("pl")
        : el.bar.setAttribute("pl", base < 0 ? "loss" : "profit");
      if (both_pos()) {
        opacity = base / high[ctx];
      } else if (both_neg()) {
        opacity = base / low[ctx];
      } else {
        opacity = Math.abs(base) / Math.abs(high[ctx]);
      }
      const current_color = window.getComputedStyle(el.bar).backgroundColor;
      const [r, g, b] = current_color.match(/[\d\.]+/g)!;
      el.bar.style.backgroundColor = `rgba(${r},${g},${b},${opacity})`;

      function both_pos() {
        return high[ctx] >= 0 && base >= 0;
      }
      function both_neg() {
        return low[ctx] < 0 && base < 0;
      }
    },
  });
  private get filter() {
    const { level, parent, topic_key, el } = this;
    const filter = el.root_filter.default();
    const p = parent as InsightRow;
    const gp = p.parent as InsightRow;
    switch (this.view_name) {
      case "sectors":
        if (level === 0) {
          filter.asset_sector = topic_key;
        }
        if (level === 1) {
          filter.asset_sector = p.topic_key;
          filter.asset_industry = topic_key;
        }
        break;
      case "locations":
        if (level === 0) {
          filter.country_qid = topic_key;
        }
        if (level === 1) {
          filter.country_qid = p.topic_key;
          filter.region_qid = topic_key;
        }
        if (level === 2) {
          filter.country_qid = gp.topic_key;
          filter.region_qid = p.topic_key;
          filter.place_qid = topic_key;
        }
        break;
    }
    return filter;
  }
  private set topic(topic: string) {
    switch (this.view_name) {
      case "sectors":
        this.topic_string = topic;
        break;
      case "locations":
        const { get } = this.cache;
        const { level } = this;
        if (level === 0) this.topic_string = get.country(topic)!;
        if (level === 1) this.topic_string = get.region(topic)!;
        if (level === 2) this.topic_string = get.place(topic)!;
        break;
    }
  }
  private get topic() {
    return this.topic_string;
  }
  private get rows() {
    return Array.from(this.el.children.children) as InsightRow[];
  }

  public totals = {} as data.tally;
  public width = 0;
  public topic_string = "";
  public topic_key = "";
  public parent = {} as InsightRow | InsightView;

  private level = 0;
  private view_name = "" as insight.view_name;
  private instrmnts = [] as id.p[];
  private view = {} as InsightView;
  private tally = {} as InsightView["tally"];

  private el = this.query.select<{
    grid: HTMLElement;
    topic: HTMLAnchorElement;
    value: MoneyString;
    pl_ur: MoneyString;
    pl_ur_perc: PercentString;
    bar_value: HTMLElement;
    bar: HTMLElement;
    children: HTMLElement;
  }>({
    grid: ["qs", ".grid"],
    topic: ["qs", '[name="topic"] a'],
    value: ["qs", '[name="market_value"]'],
    pl_ur: ["qs", '[name="pl_ur"]'],
    pl_ur_perc: ["qs", '[name="pl_ur_perc"]'],
    bar_value: ["qs", '[name="bars"] .value'],
    bar: ["qs", '[name="bars"] .bar'],
    children: ["qs", ".children"],
  });
}
