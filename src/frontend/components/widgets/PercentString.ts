import { WebComponent } from "@frontend/components/WebComponent";

export class PercentString extends WebComponent {
  static observedAttributes = ["value"];

  constructor() {
    super();
    this.props.watch("value", this.handlers.render);
  }
  private handlers = {
    render: (p: p.prop_callback) => {
      if (p.old === p.new) return;

      let val = Number(this.value);
      if (!val || isNaN(val)) return (this.innerHTML = "-");

      val = Math.round(Number(this.value) * 100) / 100;
      this.innerHTML = `${val}%`;
      if (this.is_pl) this.classList.add("pl");
      this.is_loss ? this.classList.add("loss") : this.classList.remove("loss");
    },
  };
  private props = this.api.props({});
  public get value() {
    const val = this.getAttribute("value")!;
    const number = Number(val);
    return isNaN(number) ? val : number;
  }
  public set value(percent: number | string) {
    this.setAttribute("value", String(percent));
  }

  private get is_pl() {
    return this.hasAttribute("pl");
  }
  private get is_loss() {
    return typeof this.value === "number" && this.value < 0;
  }
}
