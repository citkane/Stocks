import { Select } from "@frontend/components/widgets";

export class SelectSector extends Select {
  static observedAttributes = ["asset_sector"];

  constructor() {
    super();
    this.dom.set_label("sector", "Sector:");

    this.props.watch("asset_sector", this.handlers.render);
    this.select_el.addEventListener("change", this.handlers.change);
  }

  private handlers = {
    render: (p: p.prop_callback) => {
      if (p.old === p.new) return;

      this.dom.add_option("all");
      this.cache.asset_sectors.forEach((sector) => {
        this.dom.add_option(sector);
      });
    },
    change: (e: Event) => {
      const { value } = e.target as HTMLSelectElement;
      this.select.apply_select("asset_sector", value);
      this.select_industry.setAttribute("asset_sector", value);
    },
  };
  private dom = { ...this.base_dom };
  private props = this.api.props({});
}
