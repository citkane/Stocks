import { SelectComponent } from "@frontend/components/widgets/SelectComponent";

export class SelectBroker extends SelectComponent {
  constructor() {
    super();
    this.dom.set_label("broker", "Broker:");
    this.props.watch("data-filter", this.handlers.render);
    this.el_select.addEventListener("change", this.handlers.change);
  }

  private handlers = {
    render: (p: p.prop_callback) => {
      if (p.old === p.new) return;

      const options = this.get_options("broker");
      if (!options) {
        this.filter.set({
          [this.name]: "all",
          a_id: "all",
        });
        return;
      }

      this.dom.make_options(options);
    },
    change: (e: Event) => {
      const { value } = e.target as HTMLSelectElement;
      this.filter.set({
        [this.name]: value,
        a_id: "all",
      });
    },
  };
  private dom = {
    ...this.base_dom,
    make_options: (options: [string, string][]) => {
      const { broker } = this.cache.filter;

      this.el_select.innerHTML = "";
      options.forEach((option) => {
        this.dom.add_option(...option);
      });
      this.el_select.value = broker!;
    },
  };
  private props = this.api.props({});
}
