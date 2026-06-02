import { RootComponent } from "@frontend/components/RootComponent";
import {
  type InstrumentRow,
  type MoneyString,
  type SelectComponent,
} from "@frontend/components";

const transition_time = 300;

export class InstrumentsRoot extends RootComponent {
  static observedAttributes = ["data-all"];

  constructor() {
    super();
    this.dom.template_to_self("instrmnts-root");
    this.data.init_sort_register();
    this.props.watch("data-all", this.handlers.render);
  }

  public apply_filter = (filter_string: string) => {
    return new Promise((resolve) => filter.bind(this)(resolve, filter_string));

    function filter(
      this: InstrumentsRoot,
      resolve: resolve_t,
      filter_string: string,
    ) {
      if (this.dom_busy) {
        return setTimeout(
          () => filter.bind(this)(resolve, filter_string),
          transition_time,
        );
      }
      this.dom.set_busy();
      clearTimeout(this.filter_timeout);
      this.filter_timeout = setTimeout(() => {
        this.instrmnt_els.forEach((r) => {
          r.setAttribute("data-filter", filter_string);
        });
        this.props.tally_money();
        this.dom.unset_busy();
        resolve();
      }, transition_time);
    }
  };
  private handlers = {
    render: (p: p.prop_callback) => {
      if (p.old === p.new) return;
      try {
        Object.values(this.instrmnts)
          .sort((a, b) => {
            //console.log({ a, b });
            return a.description.localeCompare(b.description);
          })
          .forEach((instrmnt) => {
            const { i_id } = instrmnt;
            const ex_row_el = this.props.find_instrmnt(i_id);
            const row_el = ex_row_el || this.props.make_instrmnt(i_id);
            const transactions = this.data.transactions(i_id);
            const data = { instrmnt, transactions };
            row_el.setAttribute("data-all", util.hash_id(data));
            if (!ex_row_el) this.instrmnt_wrapper_el.appendChild(row_el);
          });
      } catch (err) {
        console.error(err);
      }
      this.props.tally_money();
      if (!!p.old) return;

      this.props.init_filters();
      this.dom.set_sort_actions();
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
        () => this.dom.sort_rows("u_pl"),
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

        const sorted = [...this.instrmnt_els].sort((a, b) => {
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
    find_instrmnt: (i_id: i_id_t) => {
      return this.querySelector(`instrmnt-row[i_id="${i_id}"]`);
    },
    make_instrmnt: (i_id: i_id_t) => {
      return this.dom.make_el("instrmnt-row", "", `i_id="${i_id}"`);
    },
    tally_money: () => {
      const shown_instruments = this.selector.filter.shown_instrmnts();
      const tally = this.money.instruments.tally(shown_instruments);
      this.money.instruments.assign(this.els_money, tally);
      this.money_u_pl_total_el.money_value = tally.u_pl + tally.fx_pl;
    },

    init_filters: () => {
      this.filter.init();
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
      clearTimeout(this.search_debouncer);
      if (term.length <= 2) {
        this.select_els.forEach((el) => el.enable());
        this.filter.handle(["search", undefined]);
        return;
      }
      this.search_debouncer = setTimeout(() => {
        term = term.toLowerCase();
        this.select_els.forEach((el) => el.disable());
        this.filter.handle(["search", term]);
      }, 500);
    },
  });

  private get instrmnts() {
    return this.cache.instruments;
  }
  private get transcts() {
    return this.cache.transactions;
  }

  private get instrmnt_els() {
    return this.querySelectorAll<InstrumentRow>("instrmnt-row")
      .values()
      .toArray();
  }
  private get instrmnt_wrapper_el() {
    return this.querySelector<HTMLElement>(".wrapper.instruments")!;
  }
  private get header_money_el() {
    return this.querySelector<HTMLElement>(".header .money")!;
  }
  private get header_el() {
    return this.querySelector<HTMLElement>(".header .header")!;
  }
  private get money_u_pl_total_el() {
    return this.querySelector<MoneyString>(`.grid.u_pl [name="u_pl_total"]`)!;
  }

  private get els_money() {
    return this.selector.money.instruments(this.header_money_el);
  }
  private get search_el() {
    return this.querySelector<HTMLInputElement>(
      `.filter.wrapper [name="search"]`,
    )!;
  }
  private get select_els() {
    return this.querySelectorAll<SelectComponent>(
      `.filter.wrapper [filter][select]`,
    );
  }

  private sort_registry: { [key: string]: "up" | "dn" } = {};
  private dom_busy = false;
  private search_debouncer?: interval_t;
  private filter_timeout: any;
}
