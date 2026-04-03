import { AppElement } from "@frontend/components/AppElement.ts";

export class PositionsRoot extends AppElement {
  static observedAttributes = ["data-stock", "drawer", "broker", "account"];

  constructor() {
    super();
    this.api.set_topic(this);
    this.dom.template_to_self("position-root");
    this.setAttribute("drawer", "closed");

    this.props.watch("data-stock", this.handlers.render);
    this.props.watch("drawer", this.handlers.drawer);
    this.props.watch("broker", this.handlers.select);
    this.props.watch("account", this.handlers.select);
  }

  private handlers = {
    render: (p: p.prop_callback) => {
      if (p.old === p.new) return;

      this.dom.append_position_rows();
      this.data.refresh();
      this.position_open ? this.props.show() : this.props.hide();
    },
    select: (p: p.prop_callback) => {
      if (p.old === p.new) return;

      this.position_rows.forEach((row) => row.setAttribute(p.name, p.new));
      this.data.refresh();
    },
    drawer: (p: p.prop_callback) => {
      if (p.old === p.new) return;
      this.setAttribute("drawer", p.new);
    },
  };

  private data = this.api.data({
    refresh: () => {
      this.props.set_displayed_position_count();
      this.props.sum_values_to_props();
      this.dom.set_html_height();
    },
  });

  private dom = this.api.dom({
    append_position_rows: () => {
      const buys = util.money
        .aggregate_position(this.stock.transactions)
        .filter((t) => t.amount > 0);

      buys.forEach((transaction) => {
        const t = `data-transaction="${util.string.html_json(transaction)}"`;
        const row = this.dom.make_element("position-row", "", `${t}`);
        this.grid.appendChild(row);
      });
    },
    set_html_height: () => {
      setTimeout(() => {
        const height = `${this.scrollHeight}px`;
        this.style.height = height;
      });
    },
  });

  private props = this.api.props({
    sum_values_to_props: () => {
      const values = this.data.money_totals(this.displayed_positions);
      Object.keys(values).forEach((key) =>
        this.setAttribute(key, values[key]!.toString()),
      );
    },
    set_displayed_position_count: () =>
      this.setAttribute(
        "position_count",
        this.displayed_positions.length.toString(),
      ),
  });

  private get stock() {
    if (!!this._stock) return this._stock;
    const stock = this.dataset.stock!;
    return (this._stock = JSON.parse(stock) as stock_t<transaction_t[]>);
  }
  private get position_open() {
    return this.position_rows.length > 0 ? true : false;
  }
  private get position_rows(): NodeListOf<HTMLElement> {
    return this.querySelectorAll("position-row")!;
  }
  private get displayed_positions() {
    return [...this.querySelectorAll("position-row:not([display=none])")];
  }

  private _stock?: stock_t<transaction_t[]>;
}
