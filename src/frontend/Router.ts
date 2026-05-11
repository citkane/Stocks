import { Global } from "@frontend/Global";

export default class Router extends Global {
  constructor() {
    super();
    window.addEventListener("hashchange", this.route);
    window.addEventListener("popstate", this.route);
    this.route();
  }

  private route = () => {
    const url = new URL(window.location.href);
    const { pathname, hash } = url;
    const location = `${pathname}${hash}`;
    switch (location) {
      case "/":
        this.locate("/#instruments");
        break;
      case `/${conf.saxo.redirect}`:
        this.saxo.send_token_code();
        break;
      case "/#instruments":
        this.locate(location);
        break;
      case "/#accounts":
        this.locate(location);
        break;
    }
  };
  private locate = (location: string) => {
    if (this.app_root.hasAttribute("hidden")) {
      this.app.run();
    }
    switch (location) {
      case "/#accounts":
        this.accounts_root.removeAttribute("hidden");
        this.instruments_root.setAttribute("hidden", "");
        break;
      case "/#instruments":
        this.accounts_root.setAttribute("hidden", "");
        this.instruments_root.removeAttribute("hidden");
        break;
    }
  };
}
