import { WebComponent } from "@frontend/components/WebComponent";
import type { MoneyString } from "../widgets";

export class BalanceRow extends WebComponent {
  static observedAttributes = ["balance"];

  constructor() {
    super();
    this.dom.template_to_self("balance-row");
    this.props.watch("balance", this.handlers.render);
  }

  private handlers = {
    render: (p: pr.prop_callback) => {
      if (p.old === p.new) return;
      const { el } = this;
      const { assets_val, cash } = this.balance;
      el.currency.innerHTML = this.currency;
      el.val.money_value = assets_val;
      el.cash.money_value = cash;
      el.total.money_value = cash + assets_val;
      this.vals.assets_val = assets_val;
      this.vals.cash = cash;
    },
  };
  private props = this.api.props();
  private dom = this.api.dom();

  public vals = { cash: 0, assets_val: 0 };
  public get b_id() {
    return this.getAttribute("b_id")!;
  }
  public get currency() {
    return this.b_id.split("_")[2]!;
  }
  private get broker() {
    return this.b_id.split("_")[0]! as g.broker;
  }
  private get acc_id() {
    return this.b_id.split("_")[1]!;
  }
  private get balance() {
    return this.cache.get.balances()[this.broker][this.acc_id]![this.currency]!;
  }

  private el = this.query.select<{
    currency: HTMLElement;
    val: MoneyString;
    cash: MoneyString;
    total: MoneyString;
  }>({
    currency: ["qs", '[name="currency"]'],
    val: ["qs", '[name="assets_val"]'],
    cash: ["qs", '[name="cash"]'],
    total: ["qs", '[name="total"]'],
  });
}
