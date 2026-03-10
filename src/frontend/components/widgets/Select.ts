import { AppElement } from "@frontend/components/AppElement";

export class Select extends AppElement {
  constructor() {
    super();
    this.dom.template_to_self("select-widget");
  }
  protected dom = this.api.dom({
    add_option: (name: string, value = name) => {
      const option = this.dom.make_element("option", name, `value=${value}`);
      this.select.appendChild(option);
    },
    set_label: (name: string, label: string) => {
      this.select.setAttribute("name", name);
      this.label.setAttribute("for", name);
      this.label.innerHTML = label;
    },
  });

  protected set default_value(value: string) {
    this.select.value = value;
  }
  private get label() {
    return this.querySelector("label")!;
  }
  private get select() {
    return this.querySelector("select")!;
  }
}
