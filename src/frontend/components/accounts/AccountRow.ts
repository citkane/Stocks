import { WebComponent } from "@frontend/components/WebComponent";
import { BalanceRow, MoneyString } from "@frontend/components";

export class AccountRow extends WebComponent {
  static observedAttributes = ["accnt", "balances"];

  constructor() {
    super();
    const { dom, props, handlers } = this;
    dom.template_to_self("account-row");
    props.watch("accnt", handlers.render);
    props.watch("balances", handlers.balances);
  }

  private handlers = {
    render: (p: pr.prop_callback) => {
      if (p.old === p.new) return;

      const { el } = this;
      el.name.innerHTML = this.name;
    },
    balances: (p: pr.prop_callback) => {
      if (p.old === p.new) return;
      const { balances, dom, el } = this;
      const vals = { cash: 0, assets_val: 0 };
      Object.values(balances).forEach(dom.make_balance_row);

      this.balance_els.forEach((el) => {
        const { cash, assets_val } = el.vals;
        vals.cash += cash;
        vals.assets_val += assets_val;
      });
      this.vals = vals;
      el.val.money_value = vals.assets_val;
      el.cash.money_value = vals.cash;
      el.total.money_value = vals.cash + vals.assets_val;
    },
  };

  private props = this.api.props();
  private dom = this.api.dom({
    make_balance_row: (balance: lv.balance) => {
      const { el, balance_els, dom } = this;
      const { b_id } = balance;
      let balance_el = balance_els.find((el) => el.b_id === b_id);
      if (!balance_el) {
        balance_el = dom.make_el("balance-row", "");
        balance_el.setAttribute("b_id", b_id);
        balance_els.push(balance_el);
      }
      const hash = util.hash_id(balance);
      balance_el.setAttribute("balance", hash);
      balance_els
        .sort((a, b) => a.currency.localeCompare(b.currency))
        .forEach((row) => el.balances.appendChild(row));
    },
  });

  public vals = { cash: 0, assets_val: 0 };
  public get name() {
    return this.accnt.alias || this.acc_id;
  }
  public get acc_id() {
    return this.getAttribute("acc_id")!;
  }
  private get broker() {
    return this.getAttribute("broker")! as g.broker;
  }
  private get accnt() {
    return this.cache.get.accnts()[this.broker][this.acc_id]!;
  }
  private get balances() {
    return this.cache.get.balances()[this.broker][this.acc_id]!;
  }
  private get balance_els() {
    return Array.from(this.el.balances.children) as BalanceRow[];
  }
  private el = this.query.select<{
    name: HTMLElement;
    balances: HTMLElement;
    val: MoneyString;
    cash: MoneyString;
    total: MoneyString;
  }>({
    name: ["qs", '.header [name="name"]'],
    balances: ["qs", ".balances"],
    val: ["qs", '[name="assets_val"]'],
    cash: ["qs", '[name="cash"]'],
    total: ["qs", '[name="total"]'],
  });
}
