import { AppElement } from "@frontend/components/AppElement.ts";

export class AnyString extends AppElement {
  static observedAttributes = ["value"];

  constructor() {
    super();
    this.props.watch("value", this.handlers.render);
  }

  private handlers = {
    render: (p: p.prop_callback) => {
      if (p.old === p.new) return;
      this.innerHTML = this.value;
    },
  };
  private props = this.api.props({});

  private get value() {
    const value = this.getAttribute("value")!;
    return value === "undefined" || value === "null" ? "" : value;
  }
}
