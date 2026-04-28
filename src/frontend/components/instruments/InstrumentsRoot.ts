import { AppElement } from "@frontend/components/AppElement.ts";

export class InstrumentsRoot extends AppElement {
  static observedAttributes = ["data-all", "filter"];

  constructor() {
    super();
    this.api.set_topic(this);

    this.dom.template_to_self("instrmnts-root");
    this.props.set_header_info();
    this.data.init_sort_register();

    this.props.watch("data-all", this.handlers.render);
    this.props.watch("filter", this.handlers.filter);
  }

  private handlers = {
    render: (p: p.prop_callback) => {
      if (p.old === p.new) return;

      this.props.init_selectors();
      Object.values(this.instrmnts)
        .sort((a, b) => a.description.localeCompare(b.description))
        .forEach((instrmnt) => {
          const { i_id } = instrmnt;
          const ex_el = this.querySelector(`instrmnt-row[i_id="${i_id}"]`);
          const instrmnt_el =
            ex_el || this.dom.make_el("instrmnt-row", "", `i_id="${i_id}"`);
          const transactions = this.data.transactions(instrmnt.i_id);
          const data = { instrument: instrmnt, transactions };
          instrmnt_el.setAttribute("data-all", util.hash_id(data));

          if (!ex_el) this.grid.appendChild(instrmnt_el);
        });

      this.props.set_money_totals();
      this.dom.set_sort_actions();
    },
    filter: (p: p.prop_callback) => {
      if (p.old === p.new) return;
      this.instrmnt_rows.forEach((row) => row.setAttribute("filter", p.new));
      this.props.set_money_totals();
    },
  };

  private dom = this.api.dom({
    set_sort_actions: () => {
      [...this.header.children].forEach((child) => {
        const name = child.getAttribute("name")!;
        child.addEventListener("click", () => this.dom.sort_rows(name));
      });
    },
    sort_rows: (name: string) => {
      const dir = this.sort_registry[name];

      const is_money = this.header
        .querySelector(`[name="${name}"]`)
        ?.hasAttribute("number");

      const sorted = this.instrmnt_rows.sort((a, b) => {
        const val_a = a.getAttribute(name)!;
        const val_b = b.getAttribute(name)!;

        return is_money
          ? dir === "dn"
            ? Number(val_a) - Number(val_b)
            : Number(val_b) - Number(val_a)
          : dir === "dn"
            ? val_a.localeCompare(val_b)
            : val_b.localeCompare(val_a);
      });

      this.dom.close_all_charts();
      sorted.forEach((e) => {
        this.grid.removeChild(e);
        this.grid.appendChild(e);
      });
      this.sort_registry[name] = dir === "up" ? "dn" : "up";
    },
    close_all_charts: () => {
      this.querySelectorAll("instrmnt-chart").forEach((chart) =>
        chart.setAttribute("state", "closed"),
      );
    },
  });

  private props = this.api.props({
    set_money_totals: () => {
      const rows = this.displayed_instrmnt_rows;
      const values = this.data.money_totals(rows);
      const { market_value, div_est } = values;
      values.div_yield = (div_est! / market_value!) * 100;
      Object.keys(values).forEach((key) => {
        const value = values[key]!.toString();
        const el = this.money_row.querySelector(`[name=${key}]`)!;
        el.setAttribute("value", value);
      });
    },
    set_header_info: () => {
      this.querySelectorAll(".header > *")?.forEach((e) =>
        this.props.set_info(e),
      );
    },
    init_selectors: () => {
      this.select_broker.setAttribute("broker", "all");
      this.select_account.setAttribute("broker", "all");
      this.select_account.setAttribute("a_id", "all");
      this.select_sector.setAttribute("asset_sector", "all");
      this.select_industry.setAttribute("asset_sector", "all");
      this.select_industry.setAttribute("asset_industry", "all");
    },
  });
  private data = this.api.data({
    init_sort_register: () => {
      this.sort_registry = [...this.header.children].reduce(
        (c, el) => {
          const key = el.getAttribute("name")!;
          c[key] = "up";
          return c;
        },
        {} as { [key: string]: "up" | "dn" },
      );
    },
    transactions: (i_id: i_id_t) => {
      return this.transcts[i_id]; //.filter((t) => t.i_id === i_id);
    },
  });

  private get instrmnt_rows() {
    return [...this.querySelectorAll("instrmnt-row")];
  }
  private get displayed_instrmnt_rows() {
    return [...this.querySelectorAll("instrmnt-row:not([display=none])")];
  }
  private get money_row() {
    return this.querySelector(".money.row")!;
  }
  private get header() {
    return this.querySelector(".header")!;
  }
  private get instrmnts() {
    return this.cache.instruments;
  }
  private get transcts() {
    return this.cache.transactions;
  }

  private sort_registry: { [key: string]: "up" | "dn" } = {};
}
