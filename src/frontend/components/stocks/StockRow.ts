import { AppElement } from "../AppElement";

import { Cache, Brokers } from "../../app/index.ts";
import type { App } from "../../App";

export class StockRow extends AppElement {
  constructor() {
    super();
    this.set_topic(this);

    this.app = window.app;
    this.cache = this.app.cache;
    this.ticker = this.getAttribute("id")!;
  }

  connectedCallback() {
    this.render();
  }

  private render() {
    this.row_children.forEach((child) => this.appendChild(child));

    const newContainer = this.change_this_container("tr");
    this.add_positions_toggle(newContainer as StockRow);
  }
  private add_positions_toggle(row: StockRow) {
    const tbody = row.parentElement;
    const positions = tbody?.querySelector(
      `positions-root[ticker="${this.ticker}"]`,
    );
    const button = row.querySelector(`td[name="positions"] button`)!;

    button.addEventListener("click", (_e) => {
      const state =
        positions?.getAttribute("state") === "open" ? "closed" : "open";
      positions?.setAttribute("state", state);
    });
  }
  private get stock() {
    return this.cache.get.stock(this.ticker)!;
  }
  private get row_children() {
    return Brokers.stock_headers.map((key) => {
      let value = this.stock[key as keyof stock_t];
      if (key === "positions") {
        value = (value as Set<position_t>).size.toString();
        value = `<button>${value}</button>`;
      }
      return this.make_element("td", value as string, `name="${key}"`);
    });
  }

  protected override app: App;
  protected override cache: Cache;
  ticker: string;
}
