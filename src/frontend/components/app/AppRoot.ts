import { AppElement } from "@frontend/components/AppElement.ts";

export class AppRoot extends AppElement {
  static observedAttributes = ["ready"];

  constructor() {
    super();
    this.set_topic(this);
    this.watch("ready", this.wait_for_app_ready);
  }

  connectedCallback() {
    this.ready().then(this.render);
  }

  private render = () => {
    const accounts = document.querySelector("accounts-root")!;
    const stocks = document.querySelector("stocks-root")!;

    accounts.setAttribute("ready", "true");
    stocks.setAttribute("ready", "true");
  };

  private wait_for_app_ready = (old_value: string) => {
    if (!!old_value) return this.ready_resolver?.reject(true);
    this.ready_resolver?.resolve(true);
  };

  private ready() {
    return new Promise((resolve, reject) => {
      this.ready_resolver = { resolve, reject };
    });
  }
  private ready_resolver?: resolver_t;
}
