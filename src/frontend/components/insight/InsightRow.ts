import { WebComponent } from "@frontend/components/WebComponent";
import {
  type InsightView,
  type data,
  type MoneyString,
  type PercentString,
} from "@frontend/components";

export class InsightRow extends WebComponent {
  constructor() {
    super();
    this.dom.template_to_self("insight-row");
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
    this.instrmnts = instrmnts;
    this.topic = topic;
    this.totals = this.tally.empty();
  };
  public append_child = (child: InsightRow) => {
    this.el.children.appendChild(child);
  };
  public calc_total = (parent_totals: data.tally) => {
    const { rows, tally, instrmnts, totals } = this;
    rows.length
      ? rows.forEach((row) => row.calc_total(totals))
      : tally.instrmnts(instrmnts, totals);

    tally.children([totals], parent_totals);
    tally.high_low(totals, parent_totals);
  };
  public render = (parent_width?: number) => {
    const { market_value, pl_ur_perc } = this.totals;
    const { el, topic, parent } = this;
    const { high } = parent.totals;
    let { rows } = this;

    el.topic.innerHTML = topic;
    el.value.money_value = market_value;
    el.pl_ur.value = pl_ur_perc;

    const width = parent_width
      ? (market_value / high.market_value) * parent_width
      : (market_value / high.market_value) * 100;

    const percnt = (market_value / parent.totals.market_value) * 100;
    const info_percnt = `${Math.round(percnt * 100) / 100}%`;
    const info = `${info_percnt} of ${parent.topic_string} market value`;
    el.percent_bar.style.width = `${width}%`;
    el.percent_value.innerHTML = info;
    this.width = width;

    rows.forEach((row) => row.render(this.width));
    //rows.forEach((row) => el.children.appendChild(row));
  };
  public sort(ctx: data.ctx) {
    let { rows, el, dom } = this;
    dom.bar_background(ctx);
    switch (ctx) {
      case "pl_ur":
        rows = rows.sort((a, b) => b.totals.pl_ur_perc - a.totals.pl_ur_perc);
        break;
      case "value":
        rows = rows.sort((a, b) => b.width - a.width);
        break;
    }
    rows.forEach((row) => {
      row.sort(ctx);
      el.children.appendChild(row);
    });
  }

  private dom = this.api.dom({
    bar_background: (ctx: data.ctx) => {
      const { el, parent, totals } = this;
      const { high, low } = parent.totals;
      const { pl_ur_perc } = totals;

      console.log({ ctx });
      if (ctx === "value") {
        el.percent_bar.removeAttribute("pl");
        el.percent_bar.style.backgroundColor = "";
        return;
      }

      el.percent_bar.setAttribute("pl", pl_ur_perc < 0 ? "loss" : "profit");
      let opacity = 0;
      if (high.pl_ur_perc >= 0 && pl_ur_perc >= 0)
        opacity = pl_ur_perc / high.pl_ur_perc;
      if (low.pl_ur_perc < 0 && pl_ur_perc < 0)
        opacity = pl_ur_perc / low.pl_ur_perc;
      if (high.pl_ur_perc <= 0 || low.pl_ur_perc >= 0)
        opacity = Math.abs(pl_ur_perc) / Math.abs(high.pl_ur_perc);

      const current_color = window.getComputedStyle(
        el.percent_bar,
      ).backgroundColor;
      const [r, g, b] = current_color.match(/[\d\.]+/g)!;
      el.percent_bar.style.backgroundColor = `rgba(${r},${g},${b},${opacity})`;
    },
  });
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
  private level = 0;
  private view_name = "" as insight.view_name;
  private instrmnts = [] as id.p[];
  public topic_string = "";
  private parent = {} as InsightRow | InsightView;
  private tally = {} as InsightView["tally"];

  private el = this.query.select<{
    grid: HTMLElement;
    topic: HTMLAnchorElement;
    value: MoneyString;
    pl_ur: PercentString;
    percent_value: HTMLElement;
    percent_bar: HTMLElement;
    children: HTMLElement;
  }>({
    grid: ["qs", ".grid"],
    topic: ["qs", '[name="topic"] a'],
    value: ["qs", '[name="value"]'],
    pl_ur: ["qs", '[name="pl_ur"]'],
    percent_value: ["qs", '[name="percent"] .value'],
    percent_bar: ["qs", '[name="percent"] .bar'],
    children: ["qs", ".children"],
  });
}

// apply_data: () => {
//   const { topic, market_value, u_pl_perc, location_link } = this.row_data;
//   this.el_value.money_value = market_value;
//   this.el_u_pl.value = u_pl_perc;
//   this.el_percent_bar.setAttribute("pl", u_pl_perc > 0 ? "profit" : "loss");
//   this.el_topic.innerText = topic;
//   if (location_link) this.el_topic.href = `${location_link}#Economy`;
//
//   setTimeout(() => {
//     this.dom.bar_opacity();
//     this.el_percent_value.innerText = this.dom.percent_string();
//   });
// },
// percent_string: () => {
//   const percent = Math.round(this.percent * 100) / 100;
//   const name = this.parent?.row_data.topic || this.name;
//   return `${percent}% of ${name}`;
// },
/*
  private data = this.api.data({
    //percent_width: () => {
    //  const { root_value, market_value } = this.row_data;
    //  return (market_value / root_value) * 100;
    //},
  });
*/
//public set row_data(data: filter.insight_row_data_t) {
//  this._data = data;
//  const data_hash = util.hash_id(data);
//  this.setAttribute("data", data_hash);
//}
//public get row_data() {
//  return this._data;
//}
//private _data!: filter.insight_row_data_t;

/*
  private handlers = {
    render: (p: pr.prop_callback) => {
      if (p.old === p.new) return;

      const { el, data, dom } = this;
      //this.percent = data.percent_width();
      //dom.apply_data();
      if (!p.old) return;

      el.topic.onclick = this.handlers.wiki;
    },
    positn: (p: pr.prop_callback) => {
      if (p.old === p.new) return;
    },
    wiki: (e: Event) => {
      e.stopPropagation();
    },
  };
*/
