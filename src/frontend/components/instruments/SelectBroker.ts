import { Select } from "@frontend/components/widgets";

export class SelectBroker extends Select {
  static observedAttributes = ["broker"];

  constructor() {
    super();
    this.dom.set_label("broker", "Broker:");

    this.props.watch("broker", this.handlers.render);
    this.select_el.addEventListener("change", this.handlers.change);
  }

  private handlers = {
    render: (p: p.prop_callback) => {
      if (p.old === p.new) return;

      this.dom.add_option("all");
      this.dom.add_option("ibkr");
      this.dom.add_option("saxo");
    },
    change: (e: Event) => {
      const { value } = e.target as HTMLSelectElement;
      this.select_account.setAttribute("broker", value);
      this.select.apply_select("broker", value);
    },
  };
  private dom = { ...this.base_dom };
  private props = this.api.props({});
}
