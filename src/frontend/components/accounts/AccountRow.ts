import { AppElement } from "@frontend/components/AppElement.ts";

export class AccountRow extends AppElement {
  constructor() {
    super();
    this.set_topic(this);
    this.template_to_self("account-row");
    this.classList.add("row");
  }

  get account_id() {
    return this.getAttribute("id")!;
  }

  connectedCallback() {
    this.render();
  }

  private render() {
    const acc = this.cache.get.account(this.account_id)!;

    this.query_by_name("broker").innerHTML = acc.broker;
    this.query_by_name("alias").innerHTML = acc.alias;
    this.query_by_name("currency").innerHTML = acc.currency;
    this.query_by_name("id").innerHTML = acc.original_id;
  }
}
