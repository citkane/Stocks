import { AppElement } from "@frontend/components/AppElement.ts";
import { Brokers } from "@frontend/app/Brokers";

export class MoneyString extends AppElement {
  static observedAttributes = ["value"];

  constructor() {
    super();
    this.watch("value", this.render);
  }

  render = (old_value: string, new_value: string) => {
    if (old_value === new_value) return;
    this.innerHTML = `${this.currency}${Brokers.to_money_string(this.value)}`;
    if (this.is_pl) this.classList.add("pl");
    this.is_loss ? this.classList.add("loss") : this.classList.remove("loss");
  };

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
