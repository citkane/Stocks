import { AppElement } from "@frontend/components/AppElement.ts";
import type { Select } from "..";
const transition_time = 300;

export class InstrumentsRoot extends AppElement {
  static observedAttributes = ["data-all", "data-filter"];

  constructor() {
    super();
    this.dom.template_to_self("instrmnts-root");
    //this.props.set_header_info();
    this.data.init_sort_register();
    this.props.watch("data-all", this.handlers.render);
    this.props.watch("data-filter", this.handlers.filter);
  }

  private handlers = {
    render: (p: p.prop_callback) => {
      if (p.old === p.new) return;

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
          if (!ex_el) this.instrmnt_wrapper_el.appendChild(instrmnt_el);
        });
      this.props.set_money_totals();
      if (!!p.old) return;

      this.props.init_filters();
      this.dom.set_sort_actions();
    },
    filter: (p: p.prop_callback) => {
      if (p.old === p.new) return;
      if (this.dom_busy) {
        return setTimeout(() => this.handlers.filter(p), transition_time);
      }
      this.dom.set_busy();
      setTimeout(() => {
        this.instrmnt_els.forEach((r) => r.setAttribute("data-filter", p.new));
        this.filter_els.forEach((el) => el.setAttribute("data-filter", p.new));
        this.props.set_money_totals();
        this.dom.unset_busy();
      }, transition_time);
    },
  };

  private dom = this.api.dom({
    set_sort_actions: () => {
      [...this.header_el.children].forEach((child) => {
        const name = child.getAttribute("name")!;
        child.addEventListener("click", () => this.dom.sort_rows(name));
      });
      this.querySelector(`.grid.u_pl [name="u_pl"]`)!.addEventListener(
        "click",
        () => this.dom.sort_rows("pl"),
      );
    },
    sort_rows: (name: string) => {
      if (this.dom_busy) return;
      this.dom.set_busy();
      setTimeout(() => {
        const dir = this.sort_registry[name];
        const is_number = this.header_el
          .querySelector(`[name="${name}"]`)
          ?.hasAttribute("number");

        const sorted = this.instrmnt_els.sort((a, b) => {
          const val_a = a.getAttribute(name)!;
          const val_b = b.getAttribute(name)!;

          return is_number
            ? dir === "dn"
              ? Number(val_a) - Number(val_b)
              : Number(val_b) - Number(val_a)
            : dir === "dn"
              ? val_a.localeCompare(val_b)
              : val_b.localeCompare(val_a);
        });
        this.instrmnt_wrapper_el.innerHTML = "";
        sorted.forEach((el) => this.instrmnt_wrapper_el.appendChild(el));
        this.sort_registry[name] = dir === "up" ? "dn" : "up";
        this.dom.unset_busy();
      }, transition_time);
    },
    set_busy: () => {
      this.dom_busy = true;
      this.instrmnt_wrapper_el.classList.add("working");
    },
    unset_busy: () => {
      this.dom_busy = false;
      this.instrmnt_wrapper_el.classList.remove("working");
    },
  });

  private props = this.api.props({
    set_money_totals: () => {
      const rows = this.displayed_instrmnt_els;
      const values = this.data.money_totals(rows);
      const { market_value, div_est } = values;
      values.div_yield = (div_est! / market_value!) * 100;
      Object.keys(values).forEach((key) => {
        const value = values[key]!.toString();
        const el = this.header_money_el.querySelector(`[name=${key}]`)!;
        el.setAttribute("value", value);
      });
      const u_pl_total = values.pl! + values.fx_pl!;
      this.u_pl_total_el.setAttribute("value", String(u_pl_total));
    },
    //set_header_info: () => {
    //  this.querySelectorAll(".header > *")?.forEach((e) =>
    //    this.props.set_info(e),
    //  );
    //},
    init_filters: () => {
      const names = this.filter_els.map((el) => el.getAttribute("name")!);
      AppElement.filter_names = names;
      AppElement.make_default_filter();
      const filter_str = AppElement.filter_string;
      this.filter_els.forEach((el) =>
        el.setAttribute("data-filter", filter_str),
      );
      this.search_el.addEventListener("input", (e) =>
        this.data.search((e.target as HTMLInputElement).value),
      );
    },
  });
  private data = this.api.data({
    init_sort_register: () => {
      this.sort_registry = [...this.header_el.children].reduce(
        (c, el) => {
          const key = el.getAttribute("name")!;
          c[key] = "up";
          return c;
        },
        {} as { [key: string]: "up" | "dn" },
      );
    },
    transactions: (i_id: i_id_t) => {
      return this.transcts[i_id];
    },
    search: (term: string) => {
      if (term.length <= 2) {
        this.select_els.forEach((el) => el.enable());
        this.handle_filter(["search", undefined]);
        return;
      }
      clearTimeout(this.search_debouncer);
      this.search_debouncer = setTimeout(() => {
        term = term.toLowerCase();
        this.select_els.forEach((el) => el.disable());
        this.handle_filter(["search", term]);
      }, 500);
    },
  });

  private get instrmnt_els() {
    return [...this.querySelectorAll("instrmnt-row")];
  }
  private get instrmnt_wrapper_el() {
    return this.querySelector(".wrapper.instruments")! as HTMLElement;
  }
  private get header_money_el() {
    return this.querySelector(".header .money")!;
  }
  private get header_el() {
    return this.querySelector(".header .header")!;
  }
  private get u_pl_total_el() {
    return this.querySelector(`.grid.u_pl [name="u_pl_total"]`)!;
  }
  private get search_el() {
    return this.querySelector(
      `.filter.wrapper [name="search"]`,
    )! as HTMLInputElement;
  }
  private get select_els() {
    return this.querySelectorAll(
      `.filter.wrapper [filter][select]`,
    ) as NodeListOf<Select>;
  }

  private get instrmnts() {
    return this.cache.instruments;
  }
  private get transcts() {
    return this.cache.transactions;
  }

  private sort_registry: { [key: string]: "up" | "dn" } = {};
  private dom_busy = false;
  private search_debouncer?: interval_t;
}
