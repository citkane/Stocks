import { AppElement } from "@frontend/components/AppElement.ts";

export class StocksRoot extends AppElement {
  static value_keys = ["market_value", "buy_value", "pl", "fx_pl"];
  static observedAttributes = ["ready"];

  constructor() {
    super();
    this.set_topic(this);
    this.template_to_self("stocks-root");
    this.set_grid_columns();

    this.watch("ready", this.ready);
  }
  private render = () => {
    this.cache.stocks
      .sort((a, b) => a.description.localeCompare(b.description))
      .forEach((s) => {
        this.appendChild(this.make_stock_row(s));
      });
    const values = StocksRoot.sum_values([
      ...this.querySelectorAll("stock-row"),
    ]);

    this.set_values_to_props(values);
  };

  private make_stock_row = (s: stock_t) =>
    this.make_element("stock-row", "", `ticker="${s.ticker}"`);

  private ready = (old_value: any, new_value: any) => {
    if (old_value === new_value) return;
    this.render();
  };

  private set_values_to_props(values: { [key: string]: number }) {
    const el = this.querySelector(".header.row")!;
    Object.keys(values).forEach((key) => {
      el.querySelector(`[name=${key}]`)?.setAttribute(
        "value",
        values[key]!.toString(),
      );
    });
  }
  public static sum_values = (children: Element[]) =>
    children.reduce(
      (a, child) => {
        StocksRoot.value_keys.forEach((key) => {
          a[key]! += Number(child.getAttribute(key));
        });
        return a;
      },
      StocksRoot.value_keys.reduce(
        (c, val) => {
          return (c = { ...c, [val]: 0 });
        },
        {} as { [key: string]: number },
      ),
    );
}
