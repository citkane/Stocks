import { SelectComponent } from "@frontend/components/widgets/SelectComponent";

export class SelectIndustry extends SelectComponent {
  constructor() {
    super();
    this.dom.set_label("industry", "Industry:");
    this.props.watch("data-filter", this.handlers.render);
    this.el_select.addEventListener("change", this.handlers.change);
  }

  private handlers = {
    render: (p: pr.prop_callback) => {
      if (p.old === p.new) return;

      const options = this.get_options("asset_industry");
      if (!options) {
        this.filter.set({
          [this.name]: "all",
          asset_sector: "all",
        });
        return;
      }

      this.dom.make_options(options);
    },
    change: (e: Event) => {
      const { value } = e.target as HTMLSelectElement;
      this.filter.set({
        asset_industry: value,
      });
    },
  };
  private dom = {
    ...this.base_dom,
    make_options: (options: [string, string][]) => {
      const { asset_sector, asset_industry } = this.cache.filter;
      this.el_select.innerHTML = "";
      options.forEach((option) => {
        this.dom.add_option(...option);
      });
      if (asset_sector === "all") {
        this.el_select.value = "select";
        this.disable();
      } else {
        this.el_select.value = asset_industry!;
        this.enable();
      }
    },
  };

  private props = this.api.props({});
}
