import { WebComponent } from "@frontend/components/WebComponent";
import { BalanceRow } from "@frontend/components";

export class AccountRow extends WebComponent {
  constructor() {
    super();
    this.dom.template_to_self("account-row");
  }

  public render = () => {
    this.name_el.innerText = this.name;
    this.balances.forEach((balance) => {
      const { currency, cash, assets_val } = balance;
      if (!cash && !assets_val) return;

      const ex_el = this.dom.find_balance_row(currency);
      const balance_row = ex_el || this.dom.make_balance_row(currency);
      if (!ex_el) this.balances_wrapper_el.appendChild(balance_row);

      const balance_data = util.html.json_stringify(balance);
      balance_row.setAttribute("data-balance", balance_data);
      this.props.set_money();
    });
  };

  private props = this.api.props({
    set_money: () => {
      const { tally } = this.money.accounts;
      const { cash, assets_val, total } = tally(this.balance_row_els);
      this.els_money.cash.money_value = cash;
      this.els_money.assets.money_value = assets_val;
      this.els_money.total.money_value = total;
    },
  });
  private dom = this.api.dom({
    find_balance_row: (currency: currency_t) => {
      return this.querySelector<BalanceRow>(
        `balance-row[currency=${currency}]`,
      );
    },
    make_balance_row: (currency: currency_t) => {
      return this.dom.make_el<BalanceRow>(
        "balance-row",
        "",
        `currency="${currency}"`,
      );
    },
  });

  private get a_id() {
    return this.getAttribute("a_id")!;
  }
  private get balances() {
    return this.cache.get.balances(this.a_id) as balance_t[];
  }
  private get name() {
    const acc = this.balances[0]!;
    const { alias, a_id_original } = acc;
    return alias || a_id_original;
  }

  public get els_money() {
    return this.selector.money.accounts(this);
  }
  private get name_el() {
    return this.querySelector<HTMLElement>(`div[name="name"]`)!;
  }
  private get balances_wrapper_el() {
    return this.querySelector<HTMLElement>(".wrapper.balances")!;
  }
  private get balance_row_els() {
    return this.balances_wrapper_el
      .querySelectorAll<BalanceRow>(`balance-row`)
      .values();
  }
}
