import { WebComponent } from "@frontend/components/WebComponent";
import type { AccountRow, MoneyString } from "@frontend/components";

export class AccountsBroker extends WebComponent {
  static observedAttributes = ["accnts", "name", "balances"];

  constructor() {
    super();
    const { dom, props, handlers } = this;

    dom.template_to_self("accounts-broker");
    props.watch("name", handlers.render);
    props.watch("accnts", handlers.accnts);
    props.watch("balances", handlers.balances);
  }

  private handlers = {
    render: (p: pr.prop_callback) => {
      if (p.old === p.new) return;

      const { el } = this;
      el.name.innerHTML = this.name;
    },
    accnts: (p: pr.prop_callback) => {
      if (p.old === p.new) return;

      this.accnts.forEach((accnt) => this.dom.make_account(...accnt));
    },
    balances: (p: pr.prop_callback) => {
      if (p.old === p.new) return;
      const { el } = this;
      const balances = this.cache.get.balances();
      const vals = { cash: 0, assets_val: 0 };
      this.accnt_els.forEach((el) => {
        const hash = util.hash_id(balances[this.name]![el.acc_id]!);
        el.setAttribute("balances", hash);
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

  private props = this.api.props({});
  private dom = this.api.dom({
    make_account: (id: string, accnt: g.account) => {
      const { accnt_els, dom, el } = this;
      let accnt_el = accnt_els.find((el) => el.acc_id === id);
      if (!accnt_el) {
        accnt_el = dom.make_el("account-row", "");
        accnt_el.setAttribute("broker", this.name);
        accnt_el.setAttribute("acc_id", id);
        accnt_els.push(accnt_el);
      }
      const hash = util.hash_id(accnt);
      accnt_el.setAttribute("accnt", hash);
      accnt_els
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach((a) => el.accnts.appendChild(a));
    },
  });
  public vals = { cash: 0, assets_val: 0 };
  public get name() {
    return this.getAttribute("name")! as g.broker;
  }
  private get accnt_els() {
    return Array.from(this.el.accnts.children) as AccountRow[];
  }
  private get accnts() {
    const accnts = this.cache.get.accnts()[this.name] || {};
    return Object.entries(accnts);
  }
  private el = this.query.select<{
    name: HTMLElement;
    accnts: HTMLElement;
    val: MoneyString;
    cash: MoneyString;
    total: MoneyString;
  }>({
    name: ["qs", '.header [name="broker"]'],
    accnts: ["qs", ".accounts"],
    val: ["qs", '[name="assets_val"]'],
    cash: ["qs", '[name="cash"]'],
    total: ["qs", '[name="total"]'],
  });
}

//this.broker_el.innerText = this.broker;
//this.cache.get
//  .a_ids(this.broker)
//  .sort((a, b) => a.localeCompare(b))
//  .forEach((a_id) => {
//    const ex_el = this.dom.find_account_row(a_id);
//    const account_el = ex_el || this.dom.make_account_row(a_id);
//    if (!ex_el) this.accounts_wrapper_el.appendChild(account_el);
//    account_el.render();
//    this.props.set_money();
//  });
// set_money: () => {
//   const { tally } = this.money.accounts;
//   const { cash, assets_val, total } = tally(this.account_row_els);
//   this.els_money.cash.money_value = cash;
//   this.els_money.assets.money_value = assets_val;
//   this.els_money.total.money_value = total;
// },

//public get els_money() {
//  return this.selector.money.accounts(this);
//}
//private get broker_el() {
//  return this.querySelector<HTMLElement>(`div[name="broker"]`)!;
//}
//private get accounts_wrapper_el() {
//  return this.querySelector<HTMLElement>(".wrapper.accounts")!;
//}
//private get account_row_els() {
//  return this.accounts_wrapper_el
//    .querySelectorAll<AccountRow>(`account-row`)
//    .values();
//}

//private get broker() {
//  return this.getAttribute("broker")! as g.broker;
//}
