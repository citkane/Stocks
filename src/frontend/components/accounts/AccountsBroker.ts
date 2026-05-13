import { WebComponent } from "@frontend/components/common/index";
import type { AccountRow } from "@frontend/components";

export class AccountsBroker extends WebComponent {
  constructor() {
    super();
    this.dom.template_to_self("accounts-broker");
  }
  public render = () => {
    this.broker_el.innerText = this.broker;
    this.cache.get
      .a_ids(this.broker)
      .sort((a, b) => a.localeCompare(b))
      .forEach((a_id) => {
        const ex_el = this.dom.find_account_row(a_id);
        const account_el = ex_el || this.dom.make_account_row(a_id);
        if (!ex_el) this.accounts_wrapper_el.appendChild(account_el);
        account_el.render();
        this.props.set_money();
      });
  };

  private props = this.api.props({
    set_money: () => {
      const { tally } = this.money.accounts;
      const { cash, assets_val, total } = tally(this.account_row_els);
      this.els_money.cash.money_value = cash;
      this.els_money.assets.money_value = assets_val;
      this.els_money.total.money_value = total;
    },
  });
  private dom = this.api.dom({
    find_account_row: (a_id: string) => {
      return this.querySelector<AccountRow>(`account-row[a_id="${a_id}"]`);
    },
    make_account_row: (a_id: string) => {
      return this.dom.make_el<AccountRow>("account-row", "", `a_id="${a_id}"`);
    },
  });

  public get els_money() {
    return this.selector.money.accounts(this);
  }
  private get broker_el() {
    return this.querySelector<HTMLElement>(`div[name="broker"]`)!;
  }
  private get accounts_wrapper_el() {
    return this.querySelector<HTMLElement>(".wrapper.accounts")!;
  }
  private get account_row_els() {
    return this.accounts_wrapper_el
      .querySelectorAll<AccountRow>(`account-row`)
      .values();
  }

  private get broker() {
    return this.getAttribute("broker")! as broker_t;
  }
}
