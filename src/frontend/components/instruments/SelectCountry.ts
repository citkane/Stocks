import { SelectComponent } from "@frontend/components/widgets/SelectComponent";

export class SelectCountry extends SelectComponent {
  constructor() {
    super();
    this.dom.set_label("country", "Country:");
    this.props.watch("data-filter", this.handlers.render);
    this.el_select.addEventListener("change", this.handlers.change);
  }

  private handlers = {
    render: (p: p.prop_callback) => {
      if (p.old === p.new) return;

      const options = this.get_options("country");
      this.dom.make_options(options);
    },
    change: (e: Event) => {
      const { value } = e.target as HTMLSelectElement;

      this.filter.set({
        country: value,
        region: "all",
        place: "all",
      });
    },
  };
  private dom = {
    ...this.base_dom,
    make_options: (options: [string, string][]) => {
      const { country } = this.cache.filter;
      const is_none = this.is_none(options);
      this.el_select.innerHTML = "";
      options.forEach((option) => this.dom.add_option(...option));
      this.el_select.value = is_none ? "none" : country!;
      is_none ? this.disable() : this.enable();
    },
  };
  private props = this.api.props({});
  private is_none = (options: [string, string][]) => {
    return options[0]![1] === "none";
  };
}
