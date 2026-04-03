import { AppElement } from "@frontend/components/AppElement.ts";

export class StockRow extends AppElement {
  static observedAttributes = ["broker", "account", "data-stock"];

  constructor() {
    super();
    this.api.set_topic(this);
    this.dom.template_to_self("stock-row");

    this.props.watch("broker", this.handlers.select);
    this.props.watch("account", this.handlers.select);
    this.props.watch("data-stock", this.handlers.render);
  }

  private handlers = {
    render: (p: p.prop_callback) => {
      if (p.old === p.new) return;
      delete this._stock;

      const stock = this.dataset.stock!;
      this.positions_root.setAttribute("data-stock", `${stock}`);

      const { description, ticker } = this.stock;

      this.description_element.innerHTML = description;
      this.positions_button.innerHTML = this.positions_count;
      this.ticker_button.innerHTML = ticker;
      this.positions_button.addEventListener("click", this.handlers.drawer);
      this.ticker_button.addEventListener("click", this.handlers.drawer);

      this.props.set_money_values();
      this.props.set_context();

      Number(this.positions_count) > 0 ? this.props.show() : this.props.hide();
    },

    select: (p: p.prop_callback) => {
      if (p.old === p.new) return;

      this.positions_root.setAttribute(p.name, p.new);
      if (p.name === "broker") {
        this.removeAttribute("account");
      }
      this.props.set_money_values();
      this.positions_button.innerHTML = this.positions_count;
      this.has_positions ? this.props.show() : this.props.hide();
    },

    drawer: (e: Event) => {
      const name = (e.target as HTMLElement).getAttribute("name")!;
      let state;
      let new_state;
      switch (name) {
        case "ticker":
          state = this.stock_chart.getAttribute("drawer")!;
          new_state = state === "open" ? "closed" : "open";
          this.stock_chart.setAttribute("ticker", this.ticker);
          this.stock_chart.setAttribute("drawer", new_state);
          break;
        case "positions":
          state = this.positions_root.getAttribute("drawer")!;
          new_state = state === "open" ? "closed" : "open";
          this.setAttribute("drawer", new_state);
          this.positions_root.setAttribute("drawer", new_state);
      }
    },
  };
  private props = this.api.props({
    set_money_values: () => {
      ["market_value", "buy_value", "pl", "fx_pl"].forEach((key) => {
        const value = this.positions_root.getAttribute(key)!;
        this.setAttribute(key, value);
        this.props.query_by_name(key).setAttribute("value", value);
      });
    },
    set_context: () => {
      this.setAttribute("description", this.stock.description);
      this.setAttribute("positions", this.positions_count);
    },
  });

  private dom = this.api.dom({});
  private _stock?: stock_t;

  private get stock() {
    if (!!this._stock) return this._stock;
    const stock = this.dataset.stock!;
    return (this._stock = JSON.parse(stock)) as stock_t;
  }
  private get ticker() {
    return this.stock.ticker;
  }
  private get has_positions() {
    return Number(this.positions_count) > 0;
  }
  private get positions_count() {
    return this.positions_root.getAttribute("position_count")!;
  }

  private get ticker_button() {
    return this.querySelector("button[name=ticker]")!;
  }
  private get positions_button() {
    return this.querySelector("button[name=positions]")!;
  }
  private get positions_root(): HTMLElement {
    return this.querySelector("positions-root")!;
  }
  private get stock_chart(): HTMLElement {
    return this.querySelector("stock-chart")!;
  }
  private get description_element() {
    return this.props.query_by_name("description");
  }
}
