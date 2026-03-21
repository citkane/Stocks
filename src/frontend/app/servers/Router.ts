import { Global } from "@frontend/Global";

export class Router extends Global {
  constructor() {
    super();
    window.addEventListener("hashchange", this.route);
    window.addEventListener("popstate", this.route);
    this.route();
  }

  private async route() {
    const url = new URL(window.location.href);
    const { pathname } = url;
    switch (pathname) {
      case "/":
        this.app.run();
        break;
      case `/${conf.saxo.url.redirect.code}`:
        this.saxo.send_token_code();
        break;
    }
  }
}
