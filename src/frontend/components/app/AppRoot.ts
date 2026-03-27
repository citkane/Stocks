import { AppElement } from "@frontend/components/AppElement.ts";

export class AppRoot extends AppElement {
  static observedAttributes = ["ready"];

  constructor() {
    super();
    this.api.set_topic(this);
    this.props.watch("ready", this.handlers.wait_for_app_ready);

    this.api.connected_callback(() => this.ready().then(this.render));
  }

  private handlers = {
    wait_for_app_ready: (p: p.prop_callback) => {
      if (!!p.old) return this.ready_resolver?.reject(true);
      this.ready_resolver?.resolve(true);
    },
  };

  private ready = () => {
    return new Promise((resolve, reject) => {
      this.ready_resolver = { resolve, reject };
    });
  };
  private render = () => {
    const accounts = document.querySelector("accounts-root")!;
    const stocks = document.querySelector("stocks-root")!;

    accounts.setAttribute("ready", "true");
    stocks.setAttribute("ready", "true");
  };

  private props = this.api.props({});
  private ready_resolver?: resolver_t;
}
