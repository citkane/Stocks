import { AppElement } from "@frontend/components/AppElement.ts";

export class StocksRoot extends AppElement {
  static money_value_keys = ["market_value", "buy_value", "pl", "fx_pl"];
  static observedAttributes = ["ready", "account", "broker"];

  constructor() {
    super();
    this.api.set_topic(this);
    this.setAttribute("broker", "all");

    this.dom.template_to_self("stocks-root");
    this.props.set_header_info();
    this.data.set_sort_registry();

    this.props.watch("ready", this.handlers.ready);
    this.props.watch("broker", this.handlers.select);
    this.props.watch("account", this.handlers.select);
  }

  private handlers = {
    ready: (p: p.prop_callback) => {
      if (p.old === p.new) return;
      this.dom.render();
      this.dom.set_sort_actions();
    },

    select: (p: p.prop_callback) => {
      if (p.old === p.new) return;

      this.stock_rows.forEach((sr) => sr.setAttribute(p.name, p.new));
      this.props.set_money_totals();
    },
  };

  private dom = this.api.dom({
    render: () => {
      this.cache.stocks
        .sort((a, b) => a.description.localeCompare(b.description))
        .forEach((stock) => {
          this.grid.appendChild(this.dom.make_stock_row(stock));
        });
      this.props.set_money_totals();
    },
    make_stock_row: (s: stock_t) =>
      this.dom.make_element("stock-row", "", `ticker="${s.ticker}"`),
    set_sort_actions: () => {
      [...this.header.children].forEach((child) => {
        const name = child.getAttribute("name")!;
        child.addEventListener("click", () => this.dom.sort_stocks(name));
      });
    },
    sort_stocks: (name: string) => {
      this.dom.close_all_charts();

      const sorted = this.stock_rows.sort((a, b) => {
        const _a = a.getAttribute(name)!;
        const _b = b.getAttribute(name)!;
        if (
          ["market_value", "buy_value", "pl", "fx_pl", "positions"].includes(
            name,
          )
        ) {
          const a_num = Number(_a);
          const b_num = Number(_b);

          if (a_num > b_num) return 1;
          if (a_num < b_num) return -1;
          return 0;
        }
        return _a.localeCompare(_b);
      });
      if (this.sort_registry[name] === "up") {
        this.sort_registry[name] = "dn";
        sorted.reverse();
      } else {
        this.sort_registry[name] = "up";
      }
      sorted.forEach((e) => {
        this.grid.removeChild(e);
        this.grid.appendChild(e);
      });
    },
    close_all_charts: () => {
      this.querySelectorAll("stock-chart").forEach((chart) =>
        chart.setAttribute("state", "closed"),
      );
    },
  });

  private props = this.api.props({
    set_money_totals: () => {
      const values = this.data.money_totals(this.displayed_stock_rows);
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
  });

  private data = this.api.data({
    set_sort_registry: () => {
      this.sort_registry = [...this.header.children].reduce(
        (c, el) => {
          const key = el.getAttribute("name")!;
          c[key] = "up";
          return c;
        },
        {} as { [key: string]: "up" | "dn" },
      );
    },
  });

  private get stock_rows() {
    return [...this.querySelectorAll("stock-row")];
  }
  private get displayed_stock_rows() {
    return [...this.querySelectorAll("stock-row:not([display=none])")];
  }

  private get money_row() {
    return this.querySelector(".money.row")!;
  }
  private get header() {
    return this.querySelector(".header")!;
  }

  private sort_registry: { [key: string]: "up" | "dn" } = {};
}

const sort_dir = [...StocksRoot.money_value_keys];
