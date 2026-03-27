import { AppElement } from "@frontend/components/AppElement.ts";

export class DateString extends AppElement {
  static observedAttributes = ["value"];

  constructor() {
    super();
    this.props.watch("value", this.handlers.render);
  }

  private handlers = {
    render: (p: p.prop_callback) => {
      if (p.old === p.new) return;
      this.innerHTML = util.string.epoch_to_iso(this.value);
    },
  };
  private props = this.api.props({});

  private get value() {
    return Number(this.getAttribute("value")!);
  }
}
