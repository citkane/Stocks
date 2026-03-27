import { AppElement } from "@frontend/components/AppElement";

export class Select extends AppElement {
  constructor() {
    super();
    this.base_dom.template_to_self("select-widget");
  }

  //protected dom_extend = <T extends { [key: string]: Function }>(
  //  functions = {} as T,
  //) => {
  //  return { ...this._dom, ...functions } as typeof this._dom & T;
  //};
  protected base_dom = this.api.dom({
    add_option: (name: string, value = name) => {
      const option = this.base_dom.make_element(
        "option",
        name,
        `value=${value}`,
      );
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
  protected get label() {
    return this.querySelector("label")!;
  }
  protected get select() {
    return this.querySelector("select")!;
  }
  //protected get dom() {
  //  return this._dom as typeof this._dom;
  //}
  //protected set dom(dom: { [key: string]: Function }) {
  //  this._dom = { ...this._dom, ...dom };
  //}
}
