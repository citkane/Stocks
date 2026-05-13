import { SelectComponent } from "@frontend/components/widgets/SelectComponent";

export class SelectSector extends SelectComponent {
  constructor() {
    super();
    this.dom.set_label("sector", "Sector:");
    this.props.watch("data-filter", this.handlers.render);
    this.select_el.addEventListener("change", this.handlers.change);
  }

  private handlers = {
    render: (p: p.prop_callback) => {
      if (p.old === p.new) return;
      if (!p.old) this.dom.make_options();
      const { a_id, broker } = this.cache.filter;
      if (this.a_id === a_id && this.broker === broker) return;

      if (broker) this.broker = broker;
      if (a_id) this.a_id = a_id;
      this.dom.make_options();
    },
    change: (e: Event) => {
      const { value } = e.target as HTMLSelectElement;
      this.filter.handle([this.name, value], ["asset_industry", "all"]);
    },
  };
  private dom = {
    ...this.base_dom,
    make_options: () => {
      this.select_el.innerHTML = "";
      this.dom.add_option("all");
      this.sectors.forEach((sector) => {
        this.dom.add_option(sector, sector);
      });
    },
  };
  private props = this.api.props({});

  private get sectors() {
    const sectors = this.selector.filter
      .shown_instrmnts()
      .map((el) => el.getAttribute("asset_sector"));
    return [...new Set(sectors).values()]
      .filter((s) => s !== null)
      .sort((a, b) => a.localeCompare(b));
  }
}
