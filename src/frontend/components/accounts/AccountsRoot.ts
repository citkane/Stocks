import { LandingComponent } from "@frontend/components/LandingComponent";
import type { AccountsBroker } from "@frontend/components";

export class AccountsRoot extends LandingComponent {
  static observedAttributes = ["accounts"];
  /*
  constructor() {
    super();
    this.dom.template_to_self("accounts-root");
    this.props.watch("accounts", this.handlers.render);
  }

  private handlers = {
    render: (_p: p.prop_callback) => {
      this.cache.account_brokers
        .sort((a, b) => a.localeCompare(b))
        .forEach((broker) => {
          const ex_broker_el = this.dom.find_broker_el(broker);
          const broker_el = ex_broker_el || this.dom.make_broker_el(broker);
          if (!ex_broker_el) this.brokers_wrapper_el.appendChild(broker_el);
          broker_el.render();
          this.props.set_money();
        });
    },
  };
  private props = this.api.props({
    set_money: () => {
      const { tally } = this.money.accounts;
      const { cash, assets_val, total } = tally(this.broker_rows_els);
      this.els_money.cash.money_value = cash;
      this.els_money.assets.money_value = assets_val;
      this.els_money.total.money_value = total;
    },
  });
  private dom = this.api.dom({
    find_broker_el: (broker: g.broker) => {
      return this.querySelector<AccountsBroker>(
        `accounts-broker[broker="${broker}"]`,
      );
    },
    make_broker_el: (broker: g.broker) => {
      return this.dom.make_el<AccountsBroker>(
        "accounts-broker",
        "",
        `broker="${broker}"`,
      );
    },
  });

  public get els_money() {
    return this.selector.money.accounts(this.money_row_el);
  }
  private get broker_rows_els() {
    return this.brokers_wrapper_el
      .querySelectorAll<AccountsBroker>(`accounts-broker`)
      .values();
  }
  private get money_row_el() {
    return this.querySelector<HTMLElement>(`.grid.money`)!;
  }
  private get brokers_wrapper_el() {
    return this.querySelector<HTMLElement>(".wrapper.brokers")!;
  }
    */
}
