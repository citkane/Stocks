import { AppElement } from "@frontend/components/AppElement.ts";

export class DateString extends AppElement {
  static observedAttributes = ["value"];

  constructor() {
    super();
    this.props.watch("value", this.handlers.render);
  }

  private handlers = {
    render: (old_value: string, new_value: string) => {
      if (old_value === new_value) return;
      this.innerHTML = this.date_string(this.value);
    },
  };
  private props = this.api.props({});

  private get value() {
    return Number(this.getAttribute("value")!);
  }
  private date_string(time: number) {
    const date = new Date(time);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDay().toString().padStart(2, "0");
    return `${year}/${month}/${day}`;
  }
}
