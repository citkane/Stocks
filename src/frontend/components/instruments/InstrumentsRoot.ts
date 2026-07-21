import { LandingComponent } from "@frontend/components/LandingComponent";
import type {
  InstrumentRow,
  MoneyString,
  PercentString,
  FilterRoot,
} from "@frontend/components";

export class InstrumentsRoot extends LandingComponent {
  static observedAttributes = ["instrmnts", "positns", "filter"];

  constructor() {
    super();
    const { handlers, dom, props } = this;
    dom.template_to_self("instrmnts-root");
    props.watch("instrmnts", handlers.render);
    props.watch("positns", handlers.positns);
    props.watch("filter", handlers.filter);
  }

  private handlers = {
    render: (p: pr.prop_callback) => {
      if (p.old === p.new) return;

      const { el, dom, handlers, instrmnts, instrmnt_rows } = this;
      instrmnts.forEach((instrmnt) => {
        const { p_id } = instrmnt,
          id_prefix = "instrmnt",
          ex_row = instrmnt_rows[p_id],
          row = ex_row || dom.make_instrmnt(p_id, id_prefix);

        if (!ex_row) el.wrapper.appendChild(row);
      });

      if (p.old) return;

      const query = '.grid.header > *, .grid.pl_ur [name="pl_ur"]',
        header_cols = this.el.qsa<HTMLElement>(query);

      header_cols.forEach((el) => {
        const sorter = [
          el.getAttribute("name")!,
          el.hasAttribute("number"),
        ] as const;
        el.onclick = () => handlers.sort(sorter);
      });
    },
    positns: (p: pr.prop_callback) => {
      if (p.old === p.new) return;

      const { props } = this;
      this.positns.forEach((positn) => {
        const { p_id } = positn;

        const positn_hash = util.hash_id(positn);
        const row = this.instrmnt_rows[p_id]!;
        row.setAttribute("positn", positn_hash);
      });
      props.update_totals();
    },
    filter: (p: pr.prop_callback) => {
      if (p.old === p.new) return;

      const { el, props } = this;
      const rows = Array.from(el.wrapper.children);
      rows.forEach((el) => el.setAttribute("filter", p.new));
      props.update_totals();
    },
    sort: ([col, number]: readonly [string, boolean]) => {
      const { el, props } = this;
      let [sorted, dir] = props.sorted;
      dir = sorted === col ? (dir === "asc" ? "desc" : "asc") : "desc";
      props.sorted = [col, dir];
      const rows = Array.from(el.wrapper.children) as InstrumentRow[];
      rows
        .sort((a, b) => {
          const aa = (dir === "desc" ? a : b).values[col]!;
          const bb = (dir === "desc" ? b : a).values[col]!;
          return number
            ? Number(bb) - Number(aa)
            : String(bb).localeCompare(String(aa));
        })
        .forEach((row) => el.wrapper.appendChild(row));
    },
  };

  private props = this.api.props({
    update_totals: () => {
      const { el } = this;
      const t = self.empty_totals();
      const rows = Object.values(this.instrmnt_rows);

      rows.forEach(sum_row);
      const open = !!t.market_value && !!t.traded_value;
      const pl_ur_perc = open
        ? ((t.market_value - t.traded_value) / t.market_value) * 100
        : 0;

      el.market_value.money_value = t.market_value;
      el.traded_value.money_value = t.traded_value;
      el.div_val.money_value = t.div_val;
      el.div_est.money_value = t.div_est;
      el.div_yield.value = (t.div_est / t.market_value) * 100;
      el.pl_fx.money_value = t.pl_fx;
      el.pl_ur.money_value = t.pl_ur;
      el.pl_r.money_value = t.pl_r;
      el.pl_ur_total.money_value = t.pl_fx + t.pl_ur;
      el.pl_ur_perc.value = pl_ur_perc;

      function sum_row(row: InstrumentRow) {
        Object.entries(row.totals).forEach(([k, v]) => {
          (t as any)[k] += v;
        });
      }
    },
    sorted: [] as [string, "asc" | "desc"] | [],
  });
  private dom = this.api.dom({
    make_instrmnt: (p_id: id.p, id_prefix: string) => {
      const { dom, instrmnt_rows } = this,
        row = dom.make_el<InstrumentRow>("instrmnt-row", "");

      row.set_pid(p_id, id_prefix);
      instrmnt_rows[p_id] = row;
      return row;
    },
  });

  private get instrmnts() {
    return Object.values(this.cache.get.instrmnts()).sort((a, b) =>
      a.description.localeCompare(b.description),
    );
  }
  private get positns() {
    return Object.values(this.cache.get.positns());
  }
  private el = this.query.select<{
    filter: FilterRoot;
    wrapper: HTMLElement;
    traded_value: MoneyString;
    market_value: MoneyString;
    pl_r: MoneyString;
    pl_ur: MoneyString;
    pl_ur_total: MoneyString;
    pl_fx: MoneyString;
    pl_ur_perc: PercentString;
    div_val: MoneyString;
    div_est: MoneyString;
    div_yield: PercentString;
  }>({
    filter: ["qs", "filter-root"],
    wrapper: ["qs", ".wrapper.instruments"],
    traded_value: ["qs", '.money [name="traded_value"]'],
    market_value: ["qs", '.money [name="market_value"]'],
    pl_r: ["qs", '.money [name="pl_r"]'],
    pl_ur: ["qs", '.money [name="pl_ur"]'],
    pl_ur_total: ["qs", `[name="pl_ur_total"]`],
    pl_fx: ["qs", '.money [name="pl_fx"]'],
    pl_ur_perc: ["qs", '.money [name="pl_ur_perc"]'],
    div_val: ["qs", '.money [name="div_val"]'],
    div_est: ["qs", '.money [name="div_est"]'],
    div_yield: ["qs", '.money [name="div_yield"]'],
  });
  private instrmnt_rows = {} as { [p_id: string]: InstrumentRow };

  public static empty_totals = (): filter.totals => ({
    div_val: 0,
    div_est: 0,
    pl_fx: 0,
    pl_r: 0,
    pl_ur: 0,
    traded_value: 0,
    market_value: 0,
  });
}
const self = InstrumentsRoot;
