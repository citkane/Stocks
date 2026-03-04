import * as conf from "conf";
import type { App, Brokers } from "frontend";

export class Router {
  constructor(private app: App) {
    this.brokers = app.brokers;

    window.addEventListener("hashchange", this.route);
    window.addEventListener("popstate", this.route);
    this.route();
  }

  private async route() {
    const url = new URL(window.location.href);
    const { pathname, hash } = url;
    switch (pathname) {
      case "/":
        this.app.run();
        break;
      case `/${conf.saxo.url.redirect.code}`:
        this.brokers.saxo_login();
        break;
    }
  }

  private brokers: Brokers;
}
