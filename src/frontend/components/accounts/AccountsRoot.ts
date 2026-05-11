import { AppElement } from "@frontend/components/AppElement.ts";

export class AccountsRoot extends AppElement {
  static observedAttributes = ["accounts"];

  constructor() {
    super();
    //this.api.set_topic(this);
    this.dom.template_to_self("accounts-root");
    this.props.watch("accounts", this.handlers.render);
  }

  private handlers = {
    render: (_p: p.prop_callback) => {
      this.cache.account_brokers
        .sort((a, b) => a.localeCompare(b))
        .forEach((broker) => {
          const ex_el = this.querySelector(
            `accounts-broker[broker="${broker}"]`,
          );
          const broker_row = ex_el || this.dom.make_el("accounts-broker", "");
          broker_row.setAttribute("broker", broker);
          this.props.set_values();
          if (!!ex_el) return;

          this.brokers_wrapper.appendChild(broker_row);
        });
    },
  };
  private props = this.api.props({
    get_values: () => {
      return this.broker_rows.reduce(
        (c, el) => {
          let cash = get(el, "base_cash");
          let assets_val = get(el, "base_assets_val");
          c.cash = c.cash + Number(cash);
          c.assets_val = c.assets_val + Number(assets_val);
          c.total = c.cash + c.assets_val;
          return c;
        },
        { cash: 0, assets_val: 0, total: 0 },
      );
      function get(el: Element, attr?: string) {
        return el.getAttribute(attr || "0") as string | number;
      }
    },
    set_values: () => {
      const values = this.props.get_values();
      this.setAttribute("base_cash", String(values.cash));
      this.setAttribute("base_assets_val", String(values.assets_val));
      this.setAttribute("base_total", String(values.total));

      this.cash_el.setAttribute("value", String(values.cash));
      this.assets_val_el.setAttribute("value", String(values.assets_val));
      this.total_el.setAttribute("value", String(values.total));
    },
  });
  private dom = this.api.dom({});

  private get broker_rows() {
    return [...this.brokers_wrapper.querySelectorAll(`accounts-broker`)];
  }
  private get money_row() {
    return this.querySelector(`.grid.money`)!;
  }
  private get cash_el() {
    return this.money_row.querySelector(`[name="cash"]`)! as HTMLElement;
  }
  private get assets_val_el() {
    return this.money_row.querySelector(`[name="assets_val"]`)! as HTMLElement;
  }
  private get total_el() {
    return this.money_row.querySelector(`[name="total"]`)! as HTMLElement;
  }
  private get brokers_wrapper() {
    return this.querySelector(".wrapper.brokers")!;
  }
}
