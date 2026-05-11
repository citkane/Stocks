import { AppElement } from "@frontend/components/AppElement.ts";

export class AccountsBroker extends AppElement {
  static observedAttributes = ["broker"];

  constructor() {
    super();
    //this.api.set_topic(this);
    this.dom.template_to_self("accounts-broker");
    this.props.watch("broker", this.handlers.render);
  }

  private handlers = {
    render: (_p: p.prop_callback) => {
      this.broker_el.innerText = this.broker;
      this.cache.get
        .a_ids(this.broker)
        .sort((a, b) => a.localeCompare(b))
        .forEach((a_id) => {
          const ex_el = this.querySelector(`account-row[a_id="${a_id}"]`);
          const row_el = ex_el || this.dom.make_el("account-row", "");
          row_el.setAttribute("a_id", a_id);
          this.props.set_values();
          if (!!ex_el) return;

          this.accounts_wrapper.appendChild(row_el);
        });
    },
  };
  private props = this.api.props({
    get_values: () => {
      return this.account_rows.reduce(
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

  private get broker_el() {
    return this.querySelector(`div[name="broker"]`)! as HTMLElement;
  }
  private get accounts_wrapper() {
    return this.querySelector(".wrapper.accounts")!;
  }
  private get account_rows() {
    return [...this.accounts_wrapper.querySelectorAll(`account-row`)];
  }
  private get cash_el() {
    return this.querySelector(`[name="cash"]`)! as HTMLElement;
  }
  private get assets_val_el() {
    return this.querySelector(`[name="assets_val"]`)! as HTMLElement;
  }
  private get total_el() {
    return this.querySelector(`[name="total"]`)! as HTMLElement;
  }
  private get broker() {
    return this.getAttribute("broker")! as broker_t;
  }
}
