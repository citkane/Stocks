import { AppElement } from "@frontend/components/AppElement.ts";
import { Brokers } from "@frontend/app/Brokers";

export class PositionRow extends AppElement {
  static observedAttributes = ["broker", "account"];

  constructor() {
    super();
    this.api.set_topic(this);
    this.dom.template_to_self("position-row");

    this.props.watch("broker", this.handlers.select);
    this.props.watch("account", this.handlers.select);

    this.api.connected_callback(this.handlers.render);
  }

  private handlers = {
    render: () => {
      const data = this.data;
      if (!data) return;
      const { market_value, buy_value, pl, fx_pl, position: _position } = data;
      const { date, amount: position, broker, exchange } = _position;
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

    select: (p: p.prop_callback) => {
      if (p.old === p.new) return;

      const { a_id, broker } = this.position;

      if (this.broker && this.account)
        return broker === this.broker && a_id === this.account
          ? this.props.show()
          : this.props.hide();
      if (this.broker)
        return broker === this.broker ? this.props.show() : this.props.hide();
      if (this.account)
        return a_id === this.account ? this.props.show() : this.props.hide();

      this.props.show();
    },
  };

  private dom = this.api.dom({});
  private props = this.api.props({});

  private get broker() {
    return this.getAttribute("broker");
  }
  private get account() {
    return this.getAttribute("account");
  }
  private get position() {
    const p = this.cache.get.position(this.position_id);
    if (!p) throw Error("No position found");
    return p;
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
