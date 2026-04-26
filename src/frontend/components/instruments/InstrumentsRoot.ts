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

      delete this._data_all;
      this.instrmnts
        .sort((a, b) => a.description.localeCompare(b.description))
        .forEach((instrument) => {
          const instrmnt = this.dom.make_el("instrmnt-row", "");
          const transactions = this.data.transactions(instrument.i_id);
          const data = { instrument, transactions };
          instrmnt.setAttribute("data-all", util.html.json_stringify(data));

          this.grid.appendChild(instrmnt);
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
      const values = this.data.money_totals(this.displayed_instrmnt_rows);
      Object.keys(values).forEach((key) => {
        const value = values[key]!.toString();
        const cell = this.money_row.querySelector(`[name=${key}]`)!;
        cell.setAttribute("value", value);
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
      return this.transcts.filter((t) => `${t.exchange}-${t.ticker}` === i_id);
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
  private get data_all() {
    if (!!this._data_all) return this._data_all;
    const data = util.html.json_parse<data_all_t>(this.dataset.all!);
    return (this._data_all = data);
  }
  private get instrmnts() {
    return this.data_all.instruments;
  }
  private get transcts() {
    return this.data_all.transactions;
  }

  private sort_registry: { [key: string]: "up" | "dn" } = {};
  private _data_all?: data_all_t;
}

type data_all_t = { instruments: instrmnt_t[]; transactions: transctn_t[] };
