import { Select } from "@frontend/components/widgets";

export class SelectBroker extends Select {
  static observedAttributes = ["data-filter"];

  constructor() {
    super();
    this.dom.set_label("broker", "Broker:");
    this.props.watch("data-filter", this.handlers.render);
    this.select_el.addEventListener("change", this.handlers.change);
  }

  private handlers = {
    render: (p: p.prop_callback) => {
      if (p.old === p.new) return;
      if (!p.old) this.dom.make_options();
      this.select_el.value = this.value;
    },
    change: (e: Event) => {
      const { value } = e.target as HTMLSelectElement;
      this.handle_filter(
        [this.name, value],
        ["a_id", "all"],
        ["asset_sector", "all"],
        ["asset_industry", "all"],
      );
    },
  };
  private dom = {
    ...this.base_dom,
    make_options: () => {
      this.dom.add_option("all");
      this.dom.add_option("ibkr");
      this.dom.add_option("saxo");
    },
  };
  private props = this.api.props({});
}
