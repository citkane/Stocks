import { WebComponent } from "@frontend/components/common/index";
import type { ExpandingDrawer } from "@frontend/components";

export class AppRoot extends WebComponent {
  static observedAttributes = ["transactions", "instruments", "accounts"];

  constructor() {
    super();
    this.props.watch("transactions", this.handlers.transactions);
    this.props.watch("instruments", this.handlers.instruments);
    this.props.watch("accounts", this.handlers.accounts);
    [this.menu_instrmnts_el, this.menu_accounts_el].forEach(
      (el) => (el.onclick = this.handlers.navigate),
    );
    this.dropdown_button_el.onclick = this.dropdown_drawer_el.toggle;
    this.dropdown_els.forEach(this.props.menu_actions);
  }

  private handlers = {
    transactions: (p: p.prop_callback) => {
      if (p.new === p.old) return;
      this.transactions = p.new;
      if (!this.instruments || !this.accounts) return;
      this.render_instrmnts();
    },
    instruments: (p: p.prop_callback) => {
      if (p.new === p.old) return;
      this.instruments = p.new;
      if (!this.transactions || !this.accounts) return;
      this.render_instrmnts();
    },
    accounts: (p: p.prop_callback) => {
      if (p.new === p.old) return;
      this.selector.root.accnts.setAttribute("accounts", p.new);
      this.accounts = p.new;
      if (!this.transactions || !this.instruments) return;
      this.render_instrmnts();
    },
    navigate: (e: Event) => {
      const name = (e.target as HTMLElement).getAttribute("name");
      document.location.assign(`#${name}`);
    },
  };

  private props = this.api.props({
    menu_actions: (el: Element) => {
      el.addEventListener("click", (e: Event) => {
        const name = (e.target as HTMLElement).getAttribute("name")!;
        switch (name) {
          case "login_ibkr":
            this.messenger.send("login", "ibkr");
            break;
          case "logout_ibkr":
            this.messenger.send("logout", "ibkr");
            break;
          case "logout_saxo":
            this.messenger.send("logout", "saxo");
            break;
        }
      });
    },
  });

  private render_instrmnts = () => {
    const instrmnt_data = {
      transactions: this.transactions,
      instruments: this.instruments,
      accounts: this.accounts,
    };
    this.selector.root.instrmnts.setAttribute(
      "data-all",
      util.hash_id(instrmnt_data),
    );
  };

  private get menu_instrmnts_el() {
    return this.querySelector('menu [name="instruments"]')! as HTMLElement;
  }
  private get menu_accounts_el() {
    return this.querySelector('menu [name="accounts"]')! as HTMLElement;
  }
  private get menu_dropdown_el() {
    return this.querySelector('menu [name="dropdown"]')!;
  }
  private get dropdown_button_el() {
    return this.menu_dropdown_el.querySelector(`[button]`)! as HTMLElement;
  }
  private get dropdown_drawer_el() {
    return this.menu_dropdown_el.querySelector(
      `expanding-drawer`,
    )! as ExpandingDrawer;
  }
  private get dropdown_els() {
    return this.menu_dropdown_el.querySelectorAll("li");
  }

  private transactions?: string;
  private instruments?: string;
  private accounts?: string;
}
