import { WebComponent } from "@frontend/components/WebComponent";

export class AnyString extends WebComponent {
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

  public set value(value: number | string) {
    this.setAttribute("value", String(value));
  }
  public get value(): string {
    const value = this.getAttribute("value")!;
    return value === "undefined" || value === "null" ? "" : value;
  }
}
