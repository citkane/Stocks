import { AppElement } from "@frontend/components/AppElement.ts";

export class MoneyString extends AppElement {
  static observedAttributes = ["value"];

  constructor() {
    super();
    this.props.watch("value", this.handlers.render);
  }
  private handlers = {
    render: (p: p.prop_callback) => {
      if (p.old === p.new) return;
      this.innerHTML = `${this.currency}${util.string.money(this.value)}`;
      if (this.is_pl) this.classList.add("pl");
      this.is_loss ? this.classList.add("loss") : this.classList.remove("loss");
    },
  };
  private props = this.api.props({});
  private get value() {
    return Number(this.getAttribute("value")!);
  }
  private get currency() {
    return this.getAttribute("currency");
  }
  private get is_pl() {
    return this.hasAttribute("pl");
  }
  private get is_loss() {
    return this.value < 0;
  }
}
