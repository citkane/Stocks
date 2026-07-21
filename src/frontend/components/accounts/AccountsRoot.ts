import { LandingComponent } from "@frontend/components/LandingComponent";
import type { AccountsBroker, MoneyString } from "@frontend/components";

export class AccountsRoot extends LandingComponent {
  static observedAttributes = ["accnts", "balances"];

  constructor() {
    super();
    const { dom, props, handlers } = this;
    dom.template_to_self("accounts-root");
    props.watch("accnts", handlers.render);
    props.watch("balances", handlers.balances);
  }

  private handlers = {
    render: (p: pr.prop_callback) => {
      if (p.old === p.new) return;
      const { cache, dom } = this;
      Object.entries(cache.get.accnts()).forEach((b) => dom.make_broker(...b));
    },
    balances: (p: pr.prop_callback) => {
      if (p.old === p.new) return;

      const { el } = this;
      const balances = this.cache.get.balances();
      const vals = { cash: 0, assets_val: 0 };

      this.broker_els.forEach((el) => {
        const hash = util.hash_id(balances[el.name]);
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
  private props = this.api.props();
  private dom = this.api.dom({
    make_broker: (broker: string, accnts: { [id: string]: g.account }) => {
      const { broker_els, dom, el } = this;
      let broker_el = broker_els.find((el) => el.name === broker);
      if (!broker_el) {
        broker_el = dom.make_el<AccountsBroker>("accounts-broker", "");
        broker_el.setAttribute("name", broker);
        broker_els.push(broker_el);
      }
      const hash = util.hash_id(accnts);
      broker_el.setAttribute("accnts", hash);
      broker_els
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach((b) => el.brokers.appendChild(b));
    },
  });
  public vals = { cash: 0, assets_val: 0 };
  private get broker_els() {
    return Array.from(this.el.brokers.children) as AccountsBroker[];
  }
  private el = this.query.select<{
    brokers: HTMLElement;
    val: MoneyString;
    cash: MoneyString;
    total: MoneyString;
  }>({
    brokers: ["qs", ".brokers"],
    val: ["qs", '.money [name="assets_val"]'],
    cash: ["qs", '.money [name="cash"]'],
    total: ["qs", '.money [name="total"]'],
  });
}
