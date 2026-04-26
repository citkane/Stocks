import { AppElement } from "@frontend/components/AppElement.ts";

export class AccountRow extends AppElement {
  static observedAttributes = ["data-account"];

  constructor() {
    super();
    this.api.set_topic(this);
    this.dom.template_to_self("account-row");
    this.classList.add("row");
    this.props.watch("data-account", this.handlers.render);
    //this.api.connected_callback(this.handlers.render);
  }

  private handlers = {
    render: (p: p.prop_callback) => {
      if (p.old === p.new) return;
      Object.keys(this.account).forEach((key) => {
        const k = key as keyof account_t;
        const value = this.account[k]!;
        const el = this.querySelector(`[name="${key}"]`);
        if (!el) return;

        el.innerHTML = value || "";
      });
    },
  };
  private props = this.api.props({});
  private dom = this.api.dom({});

  private get account() {
    if (!!this._account) return this._account;
    return (this._account = util.html.json_parse<account_t>(
      this.dataset.account!,
    ));
  }

  private _account?: account_t;
}
