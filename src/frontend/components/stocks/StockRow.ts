import { AppElement } from "@frontend/components/AppElement.ts";
import { StocksRoot } from "./StocksRoot";

export class StockRow extends AppElement {
  static observedAttributes = ["broker", "account"];

  constructor() {
    super();
    this.api.set_topic(this);
    this.dom.template_to_self("stock-row");

    this.props.watch("broker", this.handlers.select);
    this.props.watch("account", this.handlers.select);

    this.api.connected_callback(this.handlers.connected);
    this.api.disconnected_callback(this.handlers.disconnected);
  }

  private handlers = {
    connected: () => {
      if (this.hasAttribute("sorting")) {
        this.removeAttribute("sorting");
        return;
      }
      this.positions_root.setAttribute("ticker", this.ticker);

      this.dom.render();
      this.props.set_money_values();
      this.props.set_context();
    },
    disconnected: () => {
      this.setAttribute("sorting", "true");
    },

    select: (p: p.prop_callback) => {
      if (p.old === p.new) return;
      this.positions_root.setAttribute(p.name, p.new);
      if (p.name === "broker") {
        this.setAttribute("account", "");
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
      const values = this.positions_root.attributes;
      StocksRoot.money_value_keys.forEach((key) => {
        const value = values.getNamedItem(key)?.value;
        if (!value) return;
        this.setAttribute(key, value);
        this.props.query_by_name(key).setAttribute("value", value);
      });
    },
    set_context: () => {
      if (!this.stock) return;
      this.setAttribute("description", this.stock.description);
      this.setAttribute("positions", this.positions_count);
    },
  });

  private dom = this.api.dom({
    render: () => {
      if (!this.stock) return;
      const { description, ticker } = this.stock;

      this.props.query_by_name("description").innerHTML = description;
      this.positions_button.innerHTML = this.positions_count;
      this.ticker_button.innerHTML = ticker;
      this.positions_button.addEventListener("click", this.handlers.drawer);
      this.ticker_button.addEventListener("click", this.handlers.drawer);
    },
  });

  private get ticker() {
    return this.getAttribute("ticker")!;
  }
  private get ticker_button() {
    return this.querySelector("button[name=ticker]")!;
  }
  private get stock() {
    return this.cache.get.stock(this.ticker);
  }
  private get has_positions() {
    return this.positions_root.style.display !== "none";
  }
  private get positions_count() {
    return this.positions_root.getAttribute("position_count")!;
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
}
