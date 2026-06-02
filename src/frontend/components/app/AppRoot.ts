import { WebComponent } from "@frontend/components/WebComponent";
import type { ExpandingDrawer } from "@frontend/components";

export class AppRoot extends WebComponent {
  static observedAttributes = [
    "transactions",
    "instruments",
    "accounts",
    "init_live_data",
  ];

  constructor() {
    super();
    this.dom.query_select();
    this.props.watch("transactions", this.handlers.transactions);
    this.props.watch("instruments", this.handlers.instruments);
    this.props.watch("accounts", this.handlers.accounts);
    this.props.watch("init_live_data", () => (this.has_live_data = true));
    this.els_nav.forEach((el) => (el.onclick = this.handlers.navigate));
    this.el_button_dropdown.onclick = () => this.el_drawer_menu.toggle();
    this.els_link_dropdown.forEach(this.props.menu_actions);
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

      if (this.has_live_data)
        this.selector.root.stats.setAttribute("instruments", p.new);
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
      const name = (e.target as HTMLElement).getAttribute("name")!;
      this.router.navigate(name);
    },
  };

  private props = this.api.props({
    menu_actions: (el: HTMLElement) => {
      el.onclick = (e: Event) => {
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
      };
    },
  });
  private dom = this.api.dom({
    query_select: () => {
      const qs_e = (query: string) => this.qs<HTMLElement>(query)!;
      const qs_d = (query: string) => this.qs<ExpandingDrawer>(query)!;
      const qsa_e = (query: string) => this.qsa<HTMLElement>(query)!;

      this.els_link_dropdown = qsa_e(`menu [name="dropdown"] li`);
      this.els_nav = qsa_e(`menu [link]`);
      this.el_button_dropdown = qs_e(`menu [name="dropdown"] [button]`);
      this.el_drawer_menu = qs_d(`menu [name="dropdown"] expanding-drawer`);
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

  private el_button_dropdown!: HTMLElement;
  private el_drawer_menu!: ExpandingDrawer;
  private els_nav!: NodeListOf<HTMLElement>;
  private els_link_dropdown!: NodeListOf<HTMLElement>;
  private qs = this.querySelector;
  private qsa = this.querySelectorAll;
  private has_live_data = false;

  private transactions?: string;
  private instruments?: string;
  private accounts?: string;
}
