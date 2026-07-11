import { WebComponent } from "@frontend/components/WebComponent";
import { type InsightRow } from "@frontend/components";

export class InsightView extends WebComponent {
  static observedAttributes = ["instrmnts", "positns", "sort"];
  constructor() {
    super();
    const { dom, props, handlers } = this;
    dom.template_to_self("insight-view");
    props.watch("instrmnts", handlers.render);
    props.watch("positns", handlers.positns);
    props.watch("sort", handlers.sort);
  }
  private handlers = {
    render: (p: pr.prop_callback) => {
      if (p.old === p.new) return;

      const { el, view_name, instrmnts, dom } = this;
      el.content.innerHTML = "";
      const data = new DataStructure(view_name, instrmnts);
      dom.make_rows(data.root);
    },
    positns: (p: pr.prop_callback) => {
      if (p.old === p.new) return;

      let { rows, dom } = this;
      rows.forEach((row) => row.calc_total(this.totals));
      rows.forEach((row) => row.render());
      dom.sort_rows(this.ctx);
    },
    sort: (p: pr.prop_callback) => {
      if (p.old === p.new) return;

      this.dom.sort_rows(p.new as data.ctx);
    },
  };
  private dom = this.api.dom({
    make_rows: (data: data.branch, level = 0, parent?: InsightRow) => {
      if (!data.children) return;

      const { dom } = this;
      Object.entries(data.children).forEach((child) =>
        dom.make_row(child, level, parent),
      );
    },
    make_row: (
      [topic, child]: [string, data.branch],
      level: number,
      parent?: InsightRow,
    ) => {
      const { dom, el } = this;
      const { instrmnts } = child;
      const row = dom.make_el<InsightRow>("insight-row", "");
      row.init(topic, instrmnts, level, this, parent);
      parent ? parent.append_child(row) : el.content.appendChild(row);
      dom.make_rows(child, level + 1, row);
    },
    sort_rows: (ctx: data.ctx) => {
      let { rows, el } = this;
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
        el.content.appendChild(row);
      });
    },
  });
  private props = this.api.props();
  public tally = {
    instrmnts: (instrmnts: id.p[], totals: data.tally) => {
      const { tally } = this;
      const cache = frontend.cache;
      const positns = cache.get.positns();
      const transctns = instrmnts
        .map((p_id) => positns[p_id]!.transctns.filter((t) => t.kind === "buy"))
        .flat();

      tally.children(transctns, totals);
    },
    children: (data: (data.tally | lv.transctn)[], totals: data.tally) => {
      data.reduce((total, data) => {
        const { market_value, traded_value } = data;
        total.market_value += market_value;
        total.traded_value += traded_value;
        return total;
      }, totals) as data.tally;
      const { market_value, traded_value } = totals;
      totals.pl_ur = market_value - traded_value;
      totals.pl_ur_perc = (totals.pl_ur / traded_value) * 100;
    },
    high_low: (total: data.tally, parent_total: data.tally) => {
      const { market_value, traded_value, pl_ur, pl_ur_perc } = total;
      const { high, low } = parent_total;
      low.market_value ||= market_value;
      low.traded_value ||= traded_value;

      if (market_value > high.market_value) high.market_value = market_value;
      if (traded_value > high.traded_value) high.traded_value = market_value;
      if (pl_ur > high.pl_ur) high.pl_ur = pl_ur;
      if (pl_ur_perc > high.pl_ur_perc) high.pl_ur_perc = pl_ur_perc;

      if (market_value < low.market_value) low.market_value = market_value;
      if (traded_value < low.traded_value) low.traded_value = market_value;
      if (pl_ur < low.pl_ur) low.pl_ur = pl_ur;
      if (pl_ur_perc < low.pl_ur_perc) low.pl_ur_perc = pl_ur_perc;
    },
    empty(): data.tally {
      const tally_base = () => ({
        market_value: 0,
        traded_value: 0,
        pl_ur: 0,
        pl_ur_perc: 0,
      });
      return { ...tally_base(), high: tally_base(), low: tally_base() };
    },
  };
  public totals = this.tally.empty();
  public show = () => {
    if (this.hasAttribute("shown")) return;

    this.props.show();
    document.body.scrollTop = this.scroll_top;
  };
  public hide = () => {
    if (this.hasAttribute("hidden")) return;

    this.scroll_top = document.body.scrollTop;
    this.props.hide();
  };
  private scroll_top = 0;
  private ctx: data.ctx = "value";

  private get rows() {
    return Array.from(this.el.content.children) as InsightRow[];
  }
  private get view_name() {
    return this.getAttribute("view")! as insight.view_name;
  }
  public topic_string = this.view_name;
  private get instrmnts() {
    return Object.values(this.cache.get.instrmnts());
  }
  private el = this.query.select<{
    content: HTMLElement;
  }>({
    content: ["qs", ".content"],
  });
}

class DataStructure {
  constructor(
    private view_name: insight.view_name,
    instrmnts: g.meta_view[],
  ) {
    this.root = this.empty_branch();
    this.root.instrmnts = instrmnts.map((i) => i.p_id);
    instrmnts.reduce((root, instrmnt) => {
      this.recurse_branches(instrmnt, root);
      return root;
    }, this.root);
  }
  public root: data.branch;

  private recurse_branches(
    instrmnt: g.meta_view,
    branch: data.branch,
    index = 0,
  ): void {
    const { asset_industry, asset_sector, geo, p_id } = instrmnt;
    const data = { asset_industry, asset_sector, ...geo };
    const key = this.keys[index]!;
    const val = data[key];
    if (!val) return;

    const is_leaf = index === this.keys.length - 1;
    if (is_leaf) {
      branch.children![val] ??= { instrmnts: [], parent: branch };
      branch.children![val]!.instrmnts.push(p_id);
      return;
    }
    branch.children![val] ??= this.empty_branch(branch);
    branch.children![val]!.instrmnts.push(p_id);

    return this.recurse_branches(instrmnt, branch.children![val]!, index + 1);
  }
  private empty_branch(parent?: data.branch): data.branch {
    return {
      parent,
      instrmnts: [],
      children: {},
    };
  }
  private get keys() {
    switch (this.view_name) {
      case "locations":
        return [
          "country_qid",
          "region_qid",
          "place_qid",
        ] as insight.key<"locations">[];
      case "sectors":
        return ["asset_sector", "asset_industry"] as insight.key<"sectors">[];
    }
  }
}

export namespace data {
  export type ctx = "value" | "pl_ur";
  export type tally = tally_base & {
    high: tally_base;
    low: tally_base;
  };
  export type branch = {
    instrmnts: id.p[];
    parent?: branch;
    children?: { [topic: string]: branch };
  };
  type tally_base = {
    market_value: number;
    traded_value: number;
    pl_ur: number;
    pl_ur_perc: number;
  };
}
