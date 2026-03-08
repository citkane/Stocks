import { AppElement } from "@frontend/components/AppElement.ts";
import { Brokers } from "frontend";

export class PositionRow extends AppElement {
  constructor() {
    super();
    this.set_topic(this);
    this.template_to_self("position-row");
    this.classList.add("row");
  }
  connectedCallback() {
    this.render();
  }

  private render() {
    const p = this.position;
    const market_value = this.market_value.toString();
    const buy_value = this.buy_value.toString();
    const pl = this.pl.toString();
    const fx_pl = this.fx_pl.toString();

    this.query_by_name("date").setAttribute("value", p.date.toString());
    this.query_by_name("position").innerHTML = p.position.toString();
    this.query_by_name("buy").setAttribute("value", buy_value);
    this.query_by_name("market").setAttribute("value", market_value);
    this.query_by_name("pl").setAttribute("value", pl);
    this.query_by_name("fx_pl").setAttribute("value", fx_pl);
    this.query_by_name("broker").innerHTML = p.broker;
    this.query_by_name("exchange").innerHTML = p.exchange;

    this.setAttribute("market_value", market_value);
    this.setAttribute("buy_value", buy_value);
    this.setAttribute("pl", pl);
    this.setAttribute("fx_pl", fx_pl);
  }

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
