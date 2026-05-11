import { AppElement } from "@frontend/components/AppElement.ts";

export class AccountRow extends AppElement {
  static observedAttributes = ["a_id"];

  constructor() {
    super();
    //this.api.set_topic(this);
    this.dom.template_to_self("account-row");
    this.props.watch("a_id", this.handlers.render);
  }

  private handlers = {
    render: (_p: p.prop_callback) => {
      this.name_el.innerText = this.name;
      this.balances.forEach((balance) => {
        const { currency, cash, assets_val } = balance as balance_t;
        if (!cash && !assets_val) return;

        const ex_el = this.querySelector(`balance-row[currency=${currency}]`);
        const balance_row = ex_el || this.dom.make_el("balance-row", "");
        balance_row.setAttribute("currency", currency);
        balance_row.setAttribute(
          "data-balance",
          util.html.json_stringify(balance),
        );
        this.props.set_values();
        if (!!ex_el) return;

        this.balances_wrapper.appendChild(balance_row);
        this.props.set_values();
      });
    },
  };
  private props = this.api.props({
    get_values: () => {
      return this.balance_rows.reduce(
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

  private get a_id() {
    return this.getAttribute("a_id")!;
  }
  private get balances() {
    return this.cache.get.balances(this.a_id);
  }
  private get name() {
    const acc = this.balances[0]!;
    const { alias, a_id_original } = acc;
    return alias || a_id_original;
  }
  private get name_el() {
    return this.querySelector(`div[name="name"]`)! as HTMLElement;
  }
  private get balances_wrapper() {
    return this.querySelector(".wrapper.balances")!;
  }
  private get balance_rows() {
    return [...this.balances_wrapper.querySelectorAll(`balance-row`)];
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
}
