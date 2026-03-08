import { AppElement } from "@frontend/components/AppElement.ts";
import { StocksRoot } from "../stocks";

export class PositionsRoot extends AppElement {
  static observedAttributes = ["ticker", "state", "span"];

  constructor() {
    super();
    this.set_topic(this);
    this.template_to_self("position-root");

    this.classList.add("grid");
    this.set_grid_columns();

    this.watch("state", this.open_close);
    this.watch("ticker", this.render);
    this.watch("span", this.span);
  }

  private render = () => {
    this.cache.positions
      .filter((p) => p.ticker === this.ticker)
      .forEach(this.append_position_row);

    this.set_html_height();
    this.setAttribute("state", "closed");
    const values = StocksRoot.sum_values([...this.children]);
    this.set_values_to_props(values);
  };
  private append_position_row = (p: position_t) => {
    const row = this.make_element("position-row", "", `id=${p.id}`);
    this.appendChild(row);
  };

  private open_close = (old_value: string, new_value: string) => {
    if (old_value === new_value) return;
    this.set_html_height();
    this.setAttribute("state", new_value);
  };

  private set_html_height() {
    this.style.height = `${this.scrollHeight}px`;
  }
  private get ticker() {
    return this.getAttribute("ticker")!;
  }
  private span = () => {
    const span = this.getAttribute("span");
    this.style.gridColumn = `1/${span}`;
  };
  private set_values_to_props(values: { [key: string]: number }) {
    Object.keys(values).forEach((key) =>
      this.setAttribute(key, values[key]!.toString()),
    );
  }
}
