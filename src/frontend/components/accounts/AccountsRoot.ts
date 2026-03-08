import { AppElement } from "@frontend/components/AppElement.ts";

export class AccountsRoot extends AppElement {
  static observedAttributes = ["ready"];

  constructor() {
    super();
    this.set_topic(this);
    this.template_to_self("accounts-root");
    this.set_grid_columns();

    this.watch("ready", this.ready);
  }

  private render = () => {
    this.cache.accounts.forEach((a) => {
      const account_row = this.make_element("account-row", "", `id="${a.id}"`);
      this.appendChild(account_row);
    });
  };

  private ready = (old_value: any, new_value: any) => {
    if (old_value === new_value) return;
    this.render();
  };
}
