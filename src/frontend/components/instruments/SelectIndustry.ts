import { SelectComponent } from "@frontend/components/widgets/SelectComponent";

export class SelectIndustry extends SelectComponent {
  constructor() {
    super();
    this.dom.set_label("industry", "Industry:");
    this.props.watch("data-filter", this.handlers.render);
    this.select_el.addEventListener("change", this.handlers.change);
  }

  public override enable = () => {
    if (this.asset_sector === "all") return;
    this.select_el.disabled = false;
  };

  private handlers = {
    render: (p: p.prop_callback) => {
      if (p.old === p.new) return;
      if (!p.old) this.dom.make_options();

      const { a_id, broker, asset_sector } = this.cache.filter;
      if (
        this.a_id === a_id &&
        this.broker === broker &&
        this.asset_sector === asset_sector
      )
        return;
      if (a_id) this.a_id = a_id;
      if (broker) this.broker = broker;
      if (asset_sector) this.asset_sector = asset_sector;
      this.dom.make_options();
    },
    change: (e: Event) => {
      const { value } = e.target as HTMLSelectElement;
      this.filter.handle([this.name, value]);
    },
  };
  private dom = {
    ...this.base_dom,
    make_options: () => {
      this.select_el.innerHTML = "";
      if (this.asset_sector === "all") {
        this.dom.add_option("Select a sector");
        this.disable();
        return;
      }
      this.enable();
      this.dom.add_option("all");
      this.industries.forEach((industry) => {
        this.dom.add_option(industry, industry);
      });
    },
  };

  private props = this.api.props({});

  private get industries() {
    const industries = this.selector.filter.shown_instrmnts().map((el) => {
      const industry = el.getAttribute("asset_industry");
      const sector = el.getAttribute("asset_sector");
      return this.asset_sector === sector ? industry : null;
    });
    return [...new Set(industries).values()]
      .filter((s) => s !== null)
      .sort((a, b) => a.localeCompare(b));
  }
}
