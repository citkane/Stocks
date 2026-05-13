import { SelectComponent } from "@frontend/components/widgets/SelectComponent";

export class SelectAccount extends SelectComponent {
  constructor() {
    super();
    this.dom.set_label("account", "Account:");
    this.props.watch("data-filter", this.handlers.render);
    this.select_el.addEventListener("change", this.handlers.change);
  }

  private handlers = {
    render: (p: p.prop_callback) => {
      if (p.old === p.new) return;
      if (!p.old) this.dom.make_options();
      const { broker } = this.cache.filter;
      if (this.broker === broker) return;
      if (broker) this.broker = broker;
      this.dom.make_options();
    },
    change: (e: Event) => {
      const { value } = e.target as HTMLSelectElement;
      this.filter.handle(
        [this.name, value],
        ["asset_sector", "all"],
        ["asset_industry", "all"],
      );
    },
  };

  public override enable = () => {
    if (this.broker === "all") return;
    this.select_el.disabled = false;
  };

  private props = this.api.props({});
  private dom = {
    ...this.base_dom,
    make_options: () => {
      this.select_el.innerHTML = "";
      if (this.broker === "all") {
        this.dom.add_option("Select a broker");
        this.disable();
        return;
      }
      this.enable();
      this.dom.add_option("all");
      const accounts = this.cache.get.accounts(this.broker as broker_t);
      const dedupe = new Set<string>();
      accounts.forEach((acc) => {
        const name = acc.alias || acc.a_id_original;
        const val = acc.a_id_original;
        if (dedupe.has(val)) return;
        dedupe.add(val);
        this.dom.add_option(name, val);
      });
    },
  };
}
