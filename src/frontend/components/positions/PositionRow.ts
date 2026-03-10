import { AppElement } from "@frontend/components/AppElement.ts";
import { Brokers } from "frontend";

export class PositionRow extends AppElement {
  static observedAttributes = ["broker"];

  constructor() {
    super();
    this.set_topic(this);
    this.dom.template_to_self("position-row");
    this.classList.add("row");

    this.props.watch("broker", this.handlers.broker);
  }
  connectedCallback() {
    this.handlers.render();
  }
  private handlers = {
    render: () => {
      const market_value = this.market_value.toString();
      const buy_value = this.buy_value.toString();
      const pl = this.pl.toString();
      const fx_pl = this.fx_pl.toString();
      const { date, position, broker, exchange } = this.position;
      const { query_by_name } = this.props;

      query_by_name("date").setAttribute("value", date.toString());
      query_by_name("position").innerHTML = position.toString();
      query_by_name("buy_value").setAttribute("value", buy_value);
      query_by_name("market_value").setAttribute("value", market_value);
      query_by_name("pl").setAttribute("value", pl);
      query_by_name("fx_pl").setAttribute("value", fx_pl);
      query_by_name("broker").innerHTML = broker;
      query_by_name("exchange").innerHTML = exchange;

      this.setAttribute("market_value", market_value);
      this.setAttribute("buy_value", buy_value);
      this.setAttribute("pl", pl);
      this.setAttribute("fx_pl", fx_pl);
    },
    broker: (old_value: string, new_value: string) => {
      if (old_value === new_value) return;
      if (new_value === "all") return this.props.show();
      this.position.broker === new_value
        ? this.props.show()
        : this.props.hide();
    },
  };

  private dom = this.api.dom({});
  private props = this.api.props({});

  private get pl() {
    return (this.market_value * 100 - this.buy_value * 100) / 100;
  }
  private get fx_pl() {
    return Brokers.fx_pl(this.position);
  }
  private get market_value() {
    return Brokers.market_value(this.position);
  }
  private get buy_value() {
    return Brokers.buy_value(this.position);
  }
  private get position() {
    return this.cache.get.position(this.position_id)!;
  }
  private get position_id() {
    return this.getAttribute("id")!;
  }
}
