import { WebComponent } from "@frontend/components/WebComponent";
import type { ExpandingDrawer } from "../widgets";
import type { FilterRoot } from "../filter";

export class AppRoot extends WebComponent {
  static observedAttributes = [
    "instrmnts",
    "positns",
    "accnts",
    "balances",
    "filter",
    "auth",
  ];

  constructor() {
    super();
    const { dom, props, el, handlers } = this;
    dom.template_to_self("app-root");

    props.watch("accnts", handlers.accnts);
    props.watch("balances", handlers.balances);
    props.watch("instrmnts", handlers.instruments);
    props.watch("positns", handlers.positns);
    props.watch("filter", handlers.filter);
    props.watch("auth", handlers.auth);

    el.buttn_menu.onclick = handlers.menu;
    el.login.onclick = handlers.login_out;
    el.logout.onclick = handlers.login_out;
    el.page_links.forEach((el) => (el.onclick = handlers.navigate));
  }

  private handlers = {
    accnts: (p: pr.prop_callback) => {
      if (p.new === p.old) return;
      this.el.root_accounts.setAttribute("accnts", p.new);
    },
    balances: (p: pr.prop_callback) => {
      if (p.new === p.old) return;
      this.el.root_accounts.setAttribute("balances", p.new);
    },
    instruments: (p: pr.prop_callback) => {
      if (p.new === p.old) return;
      this.el.root_instrmnts.setAttribute("instrmnts", p.new);
      this.el.root_insight.setAttribute("instrmnts", p.new);
    },
    positns: (p: pr.prop_callback) => {
      if (p.new === p.old) return;
      const { cache } = this;
      this.el.root_instrmnts.setAttribute("positns", p.new);
      this.el.root_insight.setAttribute("positns", p.new);
      this.el.filter.setAttribute("positns", filter_hash());
      function filter_hash() {
        const postns = Object.values(cache.get.positns());
        const f = postns.map((p) => p.transctns.map((t) => [t.broker, t.a_id]));
        return util.hash_id(f);
      }
    },
    filter: (p: pr.prop_callback) => {
      if (p.new === p.old) return;
      this.el.root_instrmnts.setAttribute("filter", p.new);
    },
    auth: (p: pr.prop_callback) => {
      if (p.old === p.new) return;
      this.dom.auth(JSON.parse(p.new));
    },
    navigate: (e: Event) => {
      const target = e.target as HTMLElement;
      const route = target.getAttribute("name")!;
      this.router.navigate(route);
    },
    menu: () => {
      this.el.drawer_menu.toggle();
    },
    login_out: (e: Event) => {
      const { messenger, dom } = this;
      const target = e.target as HTMLUListElement;
      const action = target.getAttribute("name");
      if (target.className === "disable") return;

      switch (action) {
        case "logout":
          messenger.request("logout").then(() => dom.auth(false));
          break;
        case "login":
          this.app.login();
          messenger.request("login").then(() => dom.auth(true));
          break;
      }
    },
  };
  private dom = this.api.dom({
    auth: (state: boolean) => {
      this.el.login.className = state ? "disable" : "enable";
      this.el.logout.className = state ? "enable" : "disable";
    },
  });
  private props = this.api.props();
  private el = this.query.select<{
    buttn_menu: HTMLElement;
    drawer_menu: ExpandingDrawer;
    login: HTMLUListElement;
    logout: HTMLUListElement;
    page_links: NodeListOf<HTMLElement>;
    filter: FilterRoot;
  }>({
    buttn_menu: ["qs", "#main_menu button"],
    drawer_menu: ["qs", '#main_menu [name="dropdown_menu"]'],
    login: ["qs", '#main_menu [name="login"]'],
    logout: ["qs", '#main_menu  [name="logout"]'],
    page_links: ["qsa", "#main_menu [link]"],
    filter: ["qs", "filter-root"],
  });
}
