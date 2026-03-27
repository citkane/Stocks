import { AppElement } from "@frontend/components/AppElement.ts";

export class AccountsRoot extends AppElement {
  static observedAttributes = ["ready"];

  constructor() {
    super();
    this.api.set_topic(this);
    this.dom.template_to_self("accounts-root");

    this.props.watch("ready", this.handlers.ready);
  }

  private handlers = {
    render: () => {
      this.cache.accounts.forEach((a) => {
        const account_row = this.dom.make_element(
          "account-row",
          "",
          `id="${a.a_id}"`,
        );
        this.grid.appendChild(account_row);
      });
    },

    ready: (p: p.prop_callback) => {
      if (p.old === p.new) return;
      this.handlers.render();
    },
  };

  private props = this.api.props({});
  private dom = this.api.dom({});
}
