import { AppElement } from "@frontend/components/AppElement.ts";
import { Brokers } from "@frontend/app/Brokers";

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
      const data = this.data;
      if (!data) return;
      const { market_value, buy_value, pl, fx_pl, position: _position } = data;
      const { date, position, broker, exchange } = _position;
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
      this.position?.broker === new_value
        ? this.props.show()
        : this.props.hide();
    },
  };

  private dom = this.api.dom({});
  private props = this.api.props({});
  private get position() {
    const p = this.cache.get.position(this.position_id);
    return p ? p : undefined;
  }
  private get data() {
    const position = this.position;
    if (!position) return;
    const market_value = Brokers.market_value(position);
    const fx_pl = Brokers.fx_pl(position);
    const buy_value = Brokers.buy_value(position);
    const pl = (market_value * 100 - buy_value * 100) / 100;
    return {
      position,
      market_value: market_value.toString(),
      fx_pl: fx_pl.toString(),
      buy_value: buy_value.toString(),
      pl: pl.toString(),
    };
  }
  private get position_id() {
    return this.getAttribute("id")!;
  }
}
