import { SelectComponent } from "@frontend/components/widgets/SelectComponent";

export class SelectPlace extends SelectComponent {
  constructor() {
    super();
    this.dom.set_label("place", "Place:");
    this.props.watch("data-filter", this.handlers.render);
    this.el_select.addEventListener("change", this.handlers.change);
  }

  private handlers = {
    render: (p: pr.prop_callback) => {
      if (p.old === p.new) return;

      const options = this.get_options("place");
      this.dom.make_options(options);
    },
    change: (e: Event) => {
      const { value } = e.target as HTMLSelectElement;
      this.filter.set({ place: value });
    },
  };
  private dom = {
    ...this.base_dom,
    make_options: (options: [string, string][]) => {
      const { place, region } = this.cache.filter;
      this.el_select.innerHTML = "";
      options.forEach((option) => this.dom.add_option(...option));
      if (region === "all") {
        this.el_select.value = "select";
        this.disable();
      } else {
        this.el_select.value = place!;
        this.enable();
      }
    },
  };

  private props = this.api.props({});
}
