import { WebComponent } from "@frontend/components/WebComponent";

export class DateString extends WebComponent {
  static observedAttributes = ["value"];

  constructor() {
    super();
    this.props.watch("value", this.handlers.render);
  }

  private handlers = {
    render: (p: p.prop_callback) => {
      if (p.old === p.new) return;
      const _date = util.time.epoch.to_iso(this.value);
      const [date, time] = _date.split("T");
      const [h, m] = time!.split(":");
      this.innerHTML = `${date} [${h}:${m}]`;
    },
  };
  private props = this.api.props({});

  public get value() {
    return Number(this.getAttribute("value")!);
  }
  public set value(epoch: number) {
    this.setAttribute("value", String(epoch));
  }
}
