import { AppElement } from "@frontend/components/AppElement.ts";
import { StocksRoot } from "./StocksRoot";

export class StockRow extends AppElement {
  static observedAttributes = ["broker"];

  constructor() {
    super();
    this.set_topic(this);
    this.dom.template_to_self("stock-row");
    this.classList.add("row");
    this.setAttribute("broker", "all");

    this.props.watch("broker", this.handlers.broker);
  }

  connectedCallback() {
    if (this.hasAttribute("sorting")) {
      this.removeAttribute("sorting");
      return;
    }
    this.positions_root.setAttribute("ticker", this.ticker);
    this.handlers.render();
    this.props.set_money_values();
    this.props.set_context();
    this.dom.set_chart_button();
  }
  disconnectedCallback() {
    this.setAttribute("sorting", "true");
  }

  private handlers = {
    render: () => {
      const { description, ticker } = this.stock;

      this.props.query_by_name("description").innerHTML = description;
      this.ticker_button.innerHTML = ticker;
      this.dom.set_toggle_button();
    },
    broker: (old_value: string, new_value: string) => {
      if (old_value === new_value) return;
      this.positions_root.setAttribute("broker", new_value);
      this.dom.set_toggle_button();
      this.props.set_money_values();

      if (new_value === "all") return this.props.show();
      this.has_positions ? this.props.show() : this.props.hide();
    },
    toggle_positions: () => {
      const old_state = this.positions_root.getAttribute("state");
      const new_state = old_state === "open" ? "closed" : "open";
      this.setAttribute("state", new_state);
      this.positions_root.setAttribute("state", new_state);
    },
    toggle_stock_chart: () => {
      this.stock_chart.setAttribute("ticker", this.ticker);

      const state = this.stock_chart.getAttribute("state");
      if (!state) return this.stock_chart.setAttribute("state", "open");
      this.stock_chart.setAttribute(
        "state",
        state === "open" ? "closed" : "open",
      );
    },
  };
  private props = this.api.props({
    set_money_values: () => {
      const values = this.positions_root.attributes;
      StocksRoot.money_value_keys.forEach((key) => {
        const value = values.getNamedItem(key)!.value;
        this.setAttribute(key, value);
        this.props.query_by_name(key).setAttribute("value", value);
      });
    },
    set_context: () => {
      this.setAttribute("description", this.stock.description);
      this.setAttribute("positions", this.positions_count);
    },
  });

  private dom = this.api.dom({
    set_toggle_button: () => {
      this.toggle_button.innerHTML = this.positions_count;
      this.toggle_button.addEventListener(
        "click",
        this.handlers.toggle_positions,
      );
    },
    set_chart_button: () => {
      this.ticker_button.addEventListener(
        "click",
        this.handlers.toggle_stock_chart,
      );
    },
  });

  private get ticker() {
    return this.getAttribute("ticker")!;
  }
  private get ticker_button() {
    return this.querySelector("[name=ticker] button")!;
  }
  private get stock() {
    return this.cache.get.stock(this.ticker)!;
  }
  private get has_positions() {
    return this.positions_root.style.display !== "none";
  }
  private get positions_count() {
    return this.positions_root.getAttribute("position_count")!;
  }
  private get toggle_button() {
    return this.props.query_by_name("positions").querySelector("button")!;
  }
  private get positions_root(): HTMLElement {
    return this.querySelector("positions-root")!;
  }
  private get stock_chart(): HTMLElement {
    return this.querySelector("stock-chart")!;
  }
}
