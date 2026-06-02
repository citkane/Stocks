import { SelectComponent } from "@frontend/components/widgets/SelectComponent";

export class SelectRegion extends SelectComponent {
  constructor() {
    super();
    this.dom.set_label("region", "Region:");
    this.props.watch("data-filter", this.handlers.render);
    this.el_select.addEventListener("change", this.handlers.change);
  }

  private handlers = {
    render: (p: p.prop_callback) => {
      if (p.old === p.new) return;

      const options = this.get_options("region");
      if (!options) {
        alert("no region");
        //this.filter.set({
        //  [this.name]: "all",
        //  country: "all",
        //});
        return;
      }

      this.dom.make_options(options);
    },
    change: (e: Event) => {
      const { value } = e.target as HTMLSelectElement;
      this.filter.set({ [this.name]: value, place: "all" });
    },
  };
  private dom = {
    ...this.base_dom,
    make_options: (options: [string, string][]) => {
      const { region, country } = this.cache.filter;
      this.el_select.innerHTML = "";
      options.forEach((option) => this.dom.add_option(...option));
      if (country === "all") {
        this.el_select.value = "select";
        this.disable();
      } else {
        this.el_select.value = region!;
        this.enable();
      }
    },
  };

  private props = this.api.props({});
}
