import { AppElement } from "@frontend/components/AppElement.ts";
import { Brokers, type Cache, type App } from "frontend";

export class AccountRow extends AppElement {
  constructor() {
    super();
    this.set_topic(this);

    this.app = window.app;
    this.cache = this.app.cache;
    this.account_id = this.getAttribute("id") || "";
    //this.removeAttribute("id")
    //this.setAttribute("display", "none")
  }
  connectedCallback() {
    this.render();
  }

  private render() {
    this.row_children.forEach((child) => this.appendChild(child));

    this.change_this_container("tr");
  }
  private get row_children() {
    return Brokers.account_headers.map((key) => {
      const value = this.account![key as keyof account_t];
      return this.make_element("td", value, `name=${key}`);
    });
  }
  private get account() {
    return this.cache.get.account(this.account_id);
  }
  protected override app: App;
  protected override cache: Cache;
  account_id: string;
}
