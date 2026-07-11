import { SelectComponent } from "@frontend/components/widgets/SelectComponent";

export class SelectSector extends SelectComponent {
  constructor() {
    super();
    this.dom.set_label("sector", "Sector:");
    this.props.watch("data-filter", this.handlers.render);
    this.el_select.addEventListener("change", this.handlers.change);
  }

  private handlers = {
    render: (p: pr.prop_callback) => {
      if (p.old === p.new) return;

      const options = this.get_options("asset_sector");
      if (!options) {
        this.filter.set({
          [this.name]: "all",
          asset_industry: "all",
        });
        return;
      }

      this.dom.make_options(options);
    },
    change: (e: Event) => {
      const { value } = e.target as HTMLSelectElement;

      this.filter.set({
        asset_sector: value,
        asset_industry: "all",
        //country: "all",
        //place: "all",
      });
      //this.props.set_context();
    },
  };
  private dom = {
    ...this.base_dom,
    make_options: (options: [string, string][]) => {
      const { asset_sector } = this.cache.filter;
      this.el_select.innerHTML = "";
      options.forEach((option) => {
        this.dom.add_option(...option);
      });
      this.el_select.value = asset_sector!;
    },
  };
  private props = this.api.props({});
}
