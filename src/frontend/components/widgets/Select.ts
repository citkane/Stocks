import { AppElement } from "@frontend/components/AppElement";

export class Select extends AppElement {
  constructor() {
    super();
    this.base_dom.template_to_self("select-widget");
    this.broker = "all";
    this.a_id = "all";
    this.asset_sector = "all";
  }

  public enable = () => {
    this.select_el.disabled = false;
  };
  public disable = () => {
    this.select_el.disabled = true;
  };

  protected base_dom = this.api.dom({
    add_option: (name: string, value = name, class_name = "") => {
      const option = this.base_dom.make_el(
        "option",
        name,
        `value="${value}"`,
        `class="${class_name}"`,
      );
      this.select_el.appendChild(option);
    },
    set_label: (name: string, label: string) => {
      this.select_el.setAttribute("name", name);
      this.label_el.setAttribute("for", name);
      this.label_el.innerHTML = label;
    },
  });

  protected get value() {
    return this.select_el.value;
  }
  protected get label_el() {
    return this.querySelector("label")!;
  }
  protected get select_el() {
    return this.querySelector("select")!;
  }
  protected get name() {
    return this.getAttribute("name")! as f.filter_keys_t;
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
  protected set asset_sector(a_id: string) {
    this.setAttribute("asset_sector", a_id);
  }
  protected get asset_sector() {
    return this.getAttribute("asset_sector")!;
  }
}
