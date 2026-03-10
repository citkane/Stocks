import { AppElement } from "@frontend/components/AppElement.ts";

export class StocksRoot extends AppElement {
  static money_value_keys = ["market_value", "buy_value", "pl", "fx_pl"];
  static observedAttributes = ["ready"];

  constructor() {
    super();
    this.set_topic(this);
    this.dom.template_to_self("stocks-root");
    this.props.set_header_info();
    this.setAttribute("broker", "all");

    this.props.watch("ready", this.handlers.ready);
    this.broker_select.addEventListener(
      "change",
      this.handlers.broker_selected,
    );
  }

  private handlers = {
    ready: (old_value: any, new_value: any) => {
      if (old_value === new_value) return;
      this.handlers.render();
    },

    render: () => {
      this.cache.stocks
        .sort((a, b) => a.description.localeCompare(b.description))
        .forEach((stock) => {
          this.grid.appendChild(this.dom.make_stock_row(stock));
        });

      this.props.set_money_totals();
    },
    broker_selected: (e: Event) => {
      const broker = (e.target! as HTMLSelectElement).value;
      this.querySelectorAll("stock-row").forEach((e) =>
        e.setAttribute("broker", broker),
      );

      this.props.set_money_totals();
    },
  };

  private dom = this.api.dom({
    make_stock_row: (s: stock_t) =>
      this.dom.make_element("stock-row", "", `ticker="${s.ticker}"`),
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

  private data = this.api.data({});

  private get displayed_stock_rows() {
    return [...this.querySelectorAll("stock-row:not([display=none])")];
  }
  private get broker_select() {
    return this.querySelector("select-broker")!;
  }
  private get money_row() {
    return this.querySelector(".money.row")!;
  }
}
