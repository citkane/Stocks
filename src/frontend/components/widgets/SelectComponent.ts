import { WebComponent } from "@frontend/components/WebComponent";

export class SelectComponent extends WebComponent {
  static observedAttributes = ["data-filter"];

  constructor() {
    super();
    this.base_dom.template_to_self("select-widget");
    this.broker = "all";
    this.a_id = "all";
    this.asset_sector = "all";
    this.country = "all";
    this.place = "all";
  }
  public enable = () => {
    this.el_select.disabled = false;
  };
  public disable = () => {
    this.el_select.disabled = true;
  };

  protected base_dom = this.api.dom({
    add_option: (name: string, value = name, class_name = "") => {
      const option = this.base_dom.make_el<HTMLOptionElement>(
        "option",
        name,
        `value="${value}"`,
        `class="${class_name}"`,
      );
      this.el_select.appendChild(option);
      return option;
    },
    set_label: (name: string, label: string) => {
      this.el_select.setAttribute("name", name);
      this.el_label.setAttribute("for", name);
      this.el_label.innerHTML = label;
    },
    el_option: (value?: string) => {
      if (!value) return undefined;
      return this.el_select.querySelector<HTMLOptionElement>(
        `[value="${value}"]`,
      );
    },
  });

  protected get value() {
    return this.el_select.value;
  }
  protected get el_label() {
    return this.querySelector("label")!;
  }
  protected get el_select() {
    return this.querySelector("select")!;
  }

  protected get name() {
    return this.getAttribute("name")! as f.filter_key_t;
  }
  protected set broker(broker: string) {
    this.setAttribute("broker", broker);
  }
  protected get broker() {
    return this.getAttribute("broker")!;
  }
  protected set a_id(a_id: string) {
    this.setAttribute("a_id", a_id);
  }
  protected get a_id() {
    return this.getAttribute("a_id")!;
  }
  protected set asset_sector(sector: string) {
    this.setAttribute("asset_sector", sector);
  }
  protected get asset_sector() {
    return this.getAttribute("asset_sector")!;
  }
  protected set asset_industry(industry: string) {
    this.setAttribute("asset_industry", industry);
  }
  protected get asset_industry() {
    return this.getAttribute("asset_industry")!;
  }
  protected set country(country: string) {
    this.setAttribute("country", country);
  }
  protected get country() {
    return this.getAttribute("country")!;
  }
  protected set place(place: string) {
    this.setAttribute("place", place);
  }
  protected get place() {
    return this.getAttribute("place")!;
  }
}
