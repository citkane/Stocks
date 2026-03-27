import { Select } from "@frontend/components/widgets";

export class SelectBroker extends Select {
  constructor() {
    super();
    this.api.connected_callback(this.handlers.render);

    this.select.addEventListener("change", this.handlers.change);
  }

  private handlers = {
    render: () => {
      this.dom.set_label("broker", "Broker:");

      this.dom.add_option("all", "");
      this.dom.add_option("ibkr");
      this.dom.add_option("saxo");
    },
    change: (e: Event) => {
      const { value } = e.target as HTMLSelectElement;
      this.dom.stocks_root.setAttribute("broker", value);
      this.dom.account_selector.setAttribute("broker", value);
    },
  };
  private dom = { ...this.base_dom };
}
