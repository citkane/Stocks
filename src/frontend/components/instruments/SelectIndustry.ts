import { Select } from "@frontend/components/widgets";

export class SelectIndustry extends Select {
  static observedAttributes = ["asset_sector", "asset_industry"];

  constructor() {
    super();
    this.dom.set_label("industry", "Industry:");

    this.props.watch("asset_industry", this.handlers.render);
    this.props.watch("asset_sector", this.handlers.sector);

    this.select_el.addEventListener("change", this.handlers.change);
  }

  private handlers = {
    render: (p: p.prop_callback) => {
      if (p.old === p.new) return;

      this.dom.add_option("all");
      this.cache.asset_industries.forEach((cat) => {
        const [sector, industry] = cat;
        this.dom.add_option(industry, industry, sector);
      });
      this.dom.add_option("Select a sector", "hidden", "hidden");
    },
    sector: (p: p.prop_callback) => {
      if (p.old === p.new) return;
      this.select.apply_select("asset_industry", "all");
      p.new === "all" ? this.dom.disable_options() : this.dom.enable_options();
    },
    change: (e: Event) => {
      const { value } = e.target as HTMLSelectElement;
      this.select.apply_select("asset_industry", value);
    },
  };
  private dom = {
    ...this.base_dom,
    enable_options: () => {
      this.select_el.disabled = false;
      this.select_el.value = "all";
      this.querySelectorAll("option").forEach((option) => {
        const class_name = [...option.classList].join(" ");
        const hidden = !!class_name && class_name !== this.sector;

        option.hidden = hidden;
      });
    },
    disable_options: () => {
      this.select_el.disabled = true;
      this.select_el.value = "hidden";
      this.querySelectorAll("option").forEach((option) => {
        const class_name = option.className;
        option.hidden = class_name !== "hidden";
      });
    },
  };

  private props = this.api.props({});
  private get sector() {
    return this.getAttribute("asset_sector")!;
  }
}
