import { Select } from "./Select";

export class SelectBroker extends Select {
  constructor() {
    super();
  }
  connectedCallback() {
    this.handlers.render();
  }
  private handlers = {
    render: () => {
      this.dom.set_label("broker", "Broker:");

      this.dom.add_option("all");
      this.dom.add_option("ibkr");
      this.dom.add_option("saxo");

      this.default_value = "all";
    },
  };
}
