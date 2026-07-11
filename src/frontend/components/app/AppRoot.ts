import { WebComponent } from "@frontend/components/WebComponent";
import type { ExpandingDrawer } from "../widgets";

export class AppRoot extends WebComponent {
  static observedAttributes = ["instrmnts", "positns", "filter", "auth"];

  constructor() {
    super();
    const { dom, props, el, handlers } = this;
    dom.template_to_self("app-root");

    props.watch("instrmnts", handlers.instruments);
    //props.watch("accounts", handlers.accounts);
    props.watch("positns", handlers.positns);
    props.watch("filter", handlers.filter);
    props.watch("auth", handlers.auth);

    el.buttn_menu.onclick = handlers.menu;
    el.login.onclick = handlers.login_out;
    el.logout.onclick = handlers.login_out;
    el.qsa<HTMLElement>("#main_menu [link]").forEach(
      (el) => (el.onclick = handlers.route),
    );
  }

  private handlers = {
    instruments: (p: pr.prop_callback) => {
      if (p.new === p.old) return;

      this.el.root_instrmnts.setAttribute("instrmnts", p.new);
    },
    positns: (p: pr.prop_callback) => {
      if (p.new === p.old) return;

      this.el.root_instrmnts.setAttribute("positns", p.new);
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
      const name = (e.target as HTMLElement).getAttribute("name")!;
      this.router.navigate(name);
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
    route: (e: Event) => {
      const target = e.target as HTMLElement;
      const route = target.getAttribute("name")!;
      this.router.navigate(route);
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
  }>({
    buttn_menu: ["qs", "#main_menu button"],
    drawer_menu: ["qs", '#main_menu [name="dropdown_menu"]'],
    login: ["qs", '#main_menu [name="login"]'],
    logout: ["qs", '#main_menu  [name="logout"]'],
  });
}
