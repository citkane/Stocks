import { WebComponent } from "@frontend/components/common/index";

export class BalanceRow extends WebComponent {
  static observedAttributes = ["data-balance"];

  constructor() {
    super();
    this.dom.template_to_self("balance-row");
    this.props.watch("data-balance", this.handlers.render);
  }

  private handlers = {
    render: (p: p.prop_callback) => {
      if (p.old === p.new) return;

      delete this._balance;
      let { cash, assets_val, currency: curr } = this.balance;
      const fx = this.cache.fx[curr];
      this._money_cash = util.money.base_whole(curr, 1, cash, fx);
      this._money_assets = util.money.base_whole(curr, 1, assets_val, fx);

      cash = util.money.whole(cash);
      assets_val = util.money.whole(assets_val);
      const total = cash + assets_val;

      this.currency_el.innerText = curr;
      this.local_money_els.cash.money_value = cash;
      this.local_money_els.assets.money_value = assets_val;
      this.local_money_els.total.money_value = total;
    },
  };
  private props = this.api.props({});
  private dom = this.api.dom({});

  public get els_money() {
    return {
      cash: { money_value: this._money_cash },
      assets: { money_value: this._money_assets },
    };
  }
  public get local_money_els() {
    return this.selector.money.accounts(this);
  }
  public get money_cash() {
    return this._money_cash;
  }
  public get money_assets() {
    return this._money_assets;
  }

  private get currency_el() {
    return this.querySelector<HTMLElement>(`[name="currency"]`)!;
  }
  private get balance() {
    if (this._balance) return this._balance;
    const balance = util.html.json_parse<balance_t>(this.dataset.balance!);
    return (this._balance = balance);
  }

  private _balance?: balance_t;
  private _money_cash = 0;
  private _money_assets = 0;
}
