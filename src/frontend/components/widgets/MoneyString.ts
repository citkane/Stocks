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

      delete this._value;
      if (typeof this.value === "string") return (this.innerHTML = this.value);

      const inner_html =
        typeof this.value === "number"
          ? `${util.string.money(this.value, this.currency)}`
          : this.value;
      this.innerHTML = inner_html;

      if (this.is_pl) this.classList.add("pl");
      this.is_loss ? this.classList.add("loss") : this.classList.remove("loss");
    },
  };
  private props = this.api.props({});

  private get value() {
    if (this._value) return this._value;
    let val: string | number = this.getAttribute("value") || "-";
    const number = Number(val);
    val = !isNaN(number) && !number ? "-" : !isNaN(number) ? number : val;
    return (this._value = val);
  }
  private get currency() {
    return this.getAttribute("currency") || "";
  }
  private get is_pl() {
    return this.hasAttribute("pl");
  }
  private get is_loss() {
    return typeof this.value === "number" && this.value < 0;
  }

  private _value?: string | number;
}
