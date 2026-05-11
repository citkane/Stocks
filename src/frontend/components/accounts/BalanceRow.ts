import { AppElement } from "@frontend/components/AppElement.ts";

export class BalanceRow extends AppElement {
  static observedAttributes = ["data-balance"];

  constructor() {
    super();
    //this.api.set_topic(this);
    this.dom.template_to_self("balance-row");
    this.props.watch("data-balance", this.handlers.render);
  }

  private handlers = {
    render: (p: p.prop_callback) => {
      if (p.old === p.new) return;

      delete this._balance;
      let { cash, assets_val, currency: curr } = this.balance;
      const _cash = util.money.whole(cash);
      const _assets_val = util.money.whole(assets_val);
      const _total = (_cash || 0) + (_assets_val || 0);

      this.currency_el.innerText = curr;
      this.cash_el.setAttribute("value", String(_cash));
      this.assets_val_el.setAttribute("value", String(_assets_val));
      this.total_el.setAttribute("value", String(_total));

      const fx = this.cache.fx[curr];
      const base_cash = util.money.base_whole(curr, 1, cash, fx);
      const base_assets_val = util.money.base_whole(curr, 1, assets_val, fx);
      const base_total = (cash || 0) + (assets_val || 0);

      this.setAttribute("base_cash", String(base_cash));
      this.setAttribute("base_assets_val", String(base_assets_val));
      this.setAttribute("base_total", String(base_total));
    },
  };
  private props = this.api.props({});
  private dom = this.api.dom({});

  private get currency_el() {
    return this.querySelector(`[name="currency"]`)! as HTMLElement;
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
  private get balance() {
    if (this._balance) return this._balance;
    const balance = util.html.json_parse<balance_t>(this.dataset.balance!);
    return (this._balance = balance);
  }
  private _balance?: balance_t;
}
