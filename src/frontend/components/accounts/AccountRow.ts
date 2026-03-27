import { AppElement } from "@frontend/components/AppElement.ts";

export class AccountRow extends AppElement {
  constructor() {
    super();
    this.api.set_topic(this);
    this.dom.template_to_self("account-row");
    this.classList.add("row");
    this.api.connected_callback(this.handlers.render);
  }

  get account_id() {
    return this.getAttribute("id")!;
  }

  private handlers = {
    render: () => {
      const acc = this.cache.get.account(this.account_id);
      if (!acc) return;

      this.props.query_by_name("broker").innerHTML = acc.broker;
      this.props.query_by_name("alias").innerHTML = acc.alias || "";
      this.props.query_by_name("currency").innerHTML = acc.currency;
      this.props.query_by_name("id").innerHTML = acc.a_id;
    },
  };
  private props = this.api.props({});
  private dom = this.api.dom({});
}
