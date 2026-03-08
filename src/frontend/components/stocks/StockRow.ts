import { AppElement } from "@frontend/components/AppElement.ts";
import { StocksRoot } from "./StocksRoot";

export class StockRow extends AppElement {
  static observedAttributes = StocksRoot.value_keys;

  constructor() {
    super();
    this.set_topic(this);
    this.template_to_self("stock-row");
    this.classList.add("row");

    StocksRoot.value_keys.forEach((key) =>
      this.watch(key, (old_value: string, new_value: string) =>
        this.set_value(old_value, new_value, key),
      ),
    );
  }

  connectedCallback() {
    this.positions.setAttribute("ticker", this.ticker);
    this.positions.setAttribute("span", this.children.length.toString());
    this.render();
  }

  private render() {
    const stock = this.cache.get.stock(this.ticker)!;
    const pos_count = stock.positions.size.toString();

    this.query_by_name("description").innerHTML = stock.description;
    this.query_by_name("ticker").innerHTML = stock.ticker;
    this.query_by_name("positions").appendChild(this.toggle_button(pos_count));

    StocksRoot.value_keys.forEach((key) =>
      this.setAttribute(key, this.positions.getAttribute(key)!),
    );
  }
  private set_value = (old_value: string, new_value: string, key: string) => {
    if (old_value === new_value) return;
    this.query_by_name(key).setAttribute("value", new_value);
  };
  private toggle_button = (count: string) => {
    const button = this.make_element("button", count);
    button.addEventListener("click", this.toggle);
    return button;
  };

  private toggle = () => {
    const state = this.positions.getAttribute("state");
    this.positions.setAttribute("state", state === "open" ? "closed" : "open");
  };

  private get ticker() {
    return this.getAttribute("ticker")!;
  }

  private get positions() {
    return this.querySelector("positions-root")!;
  }
}
