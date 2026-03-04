import { AppElement } from "@frontend/components/AppElement.ts";
import { Brokers } from "frontend";
import { util } from "common";

export class StocksRoot extends AppElement {
  static observedAttributes = ["ready"];

  constructor() {
    super();
    this.set_topic(this);
    this.ready().then(this.render);
  }

  private render = () => {
    const header_row = this.make_element("tr", this.headers_html);
    this.thead.appendChild(header_row);

    this.body_children.forEach((children) => {
      this.tbody.appendChild(children.stock_row);
      this.tbody.appendChild(children.positions);
    });

    this.appendChild(this.table);
  };

  private get headers_html() {
    return Brokers.stock_headers
      .map((name) => {
        return `<th name="${name}">${util.Title_Case(name)}</th>`;
      }, [])
      .join("");
  }
  private get body_children() {
    const stocks = this.cache!.stocks;
    stocks.sort((a, b) => a.description.localeCompare(b.description));
    return stocks.map((stock) => {
      const stock_row = this.make_element(
        "stock-row",
        "",
        `id="${stock.ticker}"`,
      );
      const positions = this.make_element(
        "positions-root",
        "",
        `ticker="${stock.ticker}" class="root-container"`,
      );
      return { stock_row, positions };
    });
  }
}
