import { Global } from "@frontend/Global";

const landing_page = "/portfolio";

export default class Router extends Global {
  constructor() {
    super();
    window.addEventListener("popstate", this.route);
    this.route();
  }

  private route = () => {
    const { pathname } = window.location;
    switch (pathname) {
      case `/${conf.saxo.redirect}`:
        this.saxo.send_token_code();
        break;
      case "/":
        window.location.pathname = landing_page;
        break;
      default:
        this.locate(pathname);
    }
  };
  public navigate = (pathname: string) => {
    const url = new URL(window.location.href);
    url.pathname = pathname;
    url.search = "";
    url.hash = "";
    history.pushState({}, "", url);
    this.route();
  };

  private locate = (pathname: string) => {
    if (this.el_app_root.hasAttribute("hidden")) {
      this.app.run();
    }
    this.els_root.forEach((root) => root.hide());
    if (!this.routes[pathname as route_key_t]) {
      window.location.pathname = landing_page;
      return;
    }
    this.routes[pathname as route_key_t]();
  };
  private routes = {
    "/accounts": () => {
      this.el_accounts_root.show();
    },
    "/portfolio": () => {
      this.el_instruments_root.show();
    },
    "/insight": () => {
      this.el_insight_root.show();
    },
  };
}

type router_t = InstanceType<typeof Router>;
type routes_t = router_t["routes"];
type route_key_t = keyof routes_t;
