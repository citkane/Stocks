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

      const val = Number(this.value);
      if (!val || isNaN(val)) return (this.innerHTML = "-");

      if (this.currency === "%") {
        const val = Math.round(Number(this.value) * 10) / 10;
        this.innerHTML = `${val}%`;
      } else {
        const inner_html =
          typeof this.value === "number"
            ? `${util.string.money(this.value, this.currency)}`
            : this.value;
        this.innerHTML = inner_html;
      }

      if (this.is_pl) this.classList.add("pl");
      this.is_loss ? this.classList.add("loss") : this.classList.remove("loss");
    },
  };
  private props = this.api.props({});
  private get value() {
    const val = this.getAttribute("value")!;
    const number = Number(val);
    return isNaN(number) ? val : number;
  }
  private get currency() {
    return this.getAttribute("currency")!;
  }
  private get is_pl() {
    return this.hasAttribute("pl");
  }
  private get is_loss() {
    return typeof this.value === "number" && this.value < 0;
  }
}
