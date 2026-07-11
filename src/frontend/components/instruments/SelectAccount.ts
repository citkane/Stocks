import { SelectComponent } from "@frontend/components/widgets/SelectComponent";

export class SelectAccount extends SelectComponent {
  constructor() {
    super();
    this.dom.set_label("account", "Account:");
    this.props.watch("data-filter", this.handlers.render);
    this.el_select.addEventListener("change", this.handlers.change);
  }

  private handlers = {
    render: (p: pr.prop_callback) => {
      if (p.old === p.new) return;

      const options = this.get_options("a_id");
      if (!options) {
        this.filter.set({
          [this.name]: "all",
          broker: "all",
        });
        return;
      }

      this.dom.make_options(options);
    },
    change: (e: Event) => {
      const { value } = e.target as HTMLSelectElement;
      this.filter.set({
        [this.name]: value,
        //asset_sector: "all",
        //asset_industry: "all",
        //country: "all",
        //place: "all",
      });
    },
  };

  private props = this.api.props({});
  private dom = {
    ...this.base_dom,
    make_options: (options: [string, string][]) => {
      const { broker, a_id } = this.cache.filter;
      this.el_select.innerHTML = "";
      options.forEach((option) => {
        this.dom.add_option(...option);
      });
      if (broker === "all") {
        this.el_select.value = "select";
        this.disable();
      } else {
        this.el_select.value = a_id!;
        this.enable();
      }
    },
  };
}
