import { WebComponent } from "@frontend/components/WebComponent";
import {
  InsightBranch,
  InsightCollector,
  InsightData,
  type InsightRow,
  //type MoneyString,
  //type PercentString,
} from "@frontend/components";

export class InsightRoot extends WebComponent {
  static observedAttributes = ["instruments"];

  constructor() {
    super();
    this.dom.template_to_self("insight-root");
    this.dom.define_selectors();
    this.props.watch("instruments", this.handlers.render);
  }
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

  private handlers = {
    render: (p: p.prop_callback) => {
      if (p.old === p.new) return;

      const keys = this.keys;
      const data = new InsightData(...keys).root;
      const root = new InsightBranch("root");
      this.data.append_branches(data, root, keys);
      root.collect();

      this.dom.make_rows(root, keys);
      this.dom.set_rows_width();
    },
  };
  private props = this.api.props({});
  private dom = this.api.dom({
    make_rows: (
      data_branch: InsightBranch,
      data_keys: f.insight_key_t[],
      el_container = this.el_content,
      index = 0,
      el_row_parent?: InsightRow,
    ) => {
      const els_rows: InsightRow[] = [];
      const data_key = data_keys[index]!;
      const data_children = data_branch[data_key]!;

      Object.values(data_children).forEach((data_branch) => {
        const el_row = this.dom.make_row(data_branch, el_row_parent);
        els_rows.push(el_row);
        if (!(data_branch instanceof InsightBranch)) return;

        const container = el_row.el_rows_container;
        const i = index + 1;
        const params = [data_branch, data_keys, container, i, el_row] as const;
        this.dom.make_rows(...params);
      });
      this.dom.append_rows(els_rows, el_container, index);
    },
    make_row: (data_branch: InsightCollector, el_row_parent?: InsightRow) => {
      const el_row = this.dom.make_el<InsightRow>("insight-row", "");
      el_row.setAttribute("name", this.name);
      el_row.row_data = data_branch.row_data;
      el_row.parent = el_row_parent;
      return el_row;
    },
    append_rows: (
      els_rows: InsightRow[],
      el_container: HTMLElement,
      index: number,
    ) => {
      els_rows = els_rows.sort((a, b) => b.percent - a.percent);
      const rel_percent = els_rows[0]!.percent;
      el_container.innerHTML = "";
      els_rows.forEach((el_row) => {
        el_row.rel_percent = rel_percent;
        el_row.set_level(index);
        el_container.appendChild(el_row);
      });
    },
    set_rows_width: () => {
      this.els_row.forEach((el_row) => el_row.set_width());
    },
    define_selectors: () => {
      this.el_content = this.qs(".content")!;
    },
  });
  private data = this.api.data({
    append_branches: (
      data: InsightData["root"],
      branch: InsightBranch,
      keys: f.insight_key_t[],
      index = 0,
    ) => {
      const key = keys[index]!;
      const data_type = InsightData.data_type;
      Object.keys(data.children).forEach(append_topic.bind(this));

      function append_topic(this: InsightRoot, topic: string) {
        const data_child = data.children[topic]!;
        const is_leaf = Array.isArray(data_child.children);
        const instrmnt = data_child.instrmnt;

        const new_branch = is_leaf
          ? new InsightCollector(topic)
          : new InsightBranch(topic);

        branch.append(key, topic, new_branch);
        new_branch.set_filter(keys, index, instrmnt);

        if (!is_leaf) {
          const branch = new_branch as InsightBranch;
          const i = index + 1;
          const p = [data_type<"branch">(data_child), branch, keys, i] as const;
          return this.data.append_branches(...p);
        }

        const instrmnts = data_type<"leaf">(data_child).children;
        instrmnts.reduce((collector, instrmnt) => {
          const money_data = this.data.calc_money(instrmnt);
          const { market_value, traded_value, u_pl } = money_data;
          collector.market_value += market_value;
          collector.traded_value += traded_value;
          collector.u_pl += u_pl;
          return collector;
        }, new_branch);
      }
    },
    calc_money: (instrmnt: instrmnt_t) => {
      const { i_id } = instrmnt;
      const transactns = this.cache.get.transactions(i_id);
      const position = this.money.positions.position(transactns);
      const calc_transctns = this.money.positions.calculate_transctns(position);
      const values = calc_transctns.reduce(
        (c, transctn) => {
          const {
            price_market,
            price_traded,
            fx_traded,
            fx_market,
            currency,
            amount,
            kind,
            meta,
          } = transctn;
          if (kind !== "buy" || meta?.amount === "closed") return c;

          const market_value = util.money.base_whole(
            currency,
            amount,
            price_market,
            fx_market,
          );
          const traded_value = util.money.base_whole(
            currency,
            amount,
            price_traded,
            fx_traded,
          );
          const u_pl = util.money.u_pl_base_whole(transctn);
          const fx_pl = util.money.fx_pl_base_whole(transctn);
          const pl = u_pl + fx_pl;

          c.market_value += market_value;
          c.traded_value += traded_value;
          c.u_pl += pl;

          return c;
        },
        { market_value: 0, traded_value: 0, u_pl: 0 },
      );
      const u_pl_perc = util.money.percent_pl(
        values.traded_value,
        values.market_value,
      );
      return { ...values, u_pl_perc };
    },
  });

  private get keys() {
    return JSON.parse(this.dataset.keys!) as f.insight_key_t[];
  }
  private get els_row() {
    return this.el_content.querySelectorAll<InsightRow>("&> insight-row");
  }
  private get name() {
    return this.getAttribute("name")!;
  }
  private qs = this.querySelector;
  //private el_total_val!: MoneyString;
  //private el_total_u_pl!: PercentString;
  private el_content!: HTMLElement;

  private scroll_top = 0;
}

declare global {
  namespace f {
    type insight_key_t =
      | "asset_sector"
      | "asset_industry"
      | "country"
      | "region"
      | "place";

    type insight_row_data_t = {
      topic: string;
      root_value: number;
      market_value: number;
      u_pl: number;
      u_pl_perc: number;
      traded_value: number;
      filter: f.filter_t;
      location_link?: string;
    };
  }
}
