import { AppElement } from "@frontend/components/AppElement.ts";

export class PositionRow extends AppElement {
  static observedAttributes = ["broker", "account", "data-transaction"];

  constructor() {
    super();
    this.api.set_topic(this);
    this.dom.template_to_self("position-row");

    this.props.watch("data-transaction", this.handlers.render);
    this.props.watch("broker", this.handlers.select);
    this.props.watch("account", this.handlers.select);
  }

  private handlers = {
    render: (p: p.prop_callback) => {
      if (p.old === p.new) return;

      delete this._transaction;
      const { market_value, traded_value, pl, fx_pl } = this.values;
      const { date, amount, broker, exchange } = this.transaction;

      this.date_element.setAttribute("value", String(date));
      this.traded_value_element.setAttribute("value", String(traded_value));
      this.market_value_element.setAttribute("value", String(market_value));
      this.pl_element.setAttribute("value", String(pl));
      this.fx_pl_element.setAttribute("value", String(fx_pl));

      this.position_element.innerHTML = String(amount);
      this.broker_element.innerHTML = broker;
      this.exchange_element.innerHTML = exchange;

      this.setAttribute("market_value", String(market_value));
      this.setAttribute("buy_value", String(traded_value));
      this.setAttribute("pl", String(pl));
      this.setAttribute("fx_pl", String(fx_pl));
    },

    select: (p: p.prop_callback) => {
      if (p.old === p.new) return;

      const { a_id, broker } = this.transaction;

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
  private _transaction?: transaction_t;

  private get values() {
    const transaction = this.transaction;
    const { amount, price_traded, price_market, fx_traded, fx_market } =
      transaction;
    const fx_pl = util.money.fx_pl_base_whole(transaction);
    const pl = util.money.pl_base_whole(transaction);
    const market_value = util.money.base_money_whole(
      amount,
      price_market,
      fx_market,
    );
    const traded_value = util.money.base_money_whole(
      amount,
      price_traded,
      fx_traded,
    );

    return {
      market_value,
      traded_value,
      fx_pl,
      pl,
    };
  }
  private get transaction() {
    if (!!this._transaction) return this._transaction;
    const transaction = this.dataset.transaction!;
    return (this._transaction = JSON.parse(transaction)) as transaction_t;
  }
  private get broker() {
    return this.getAttribute("broker");
  }
  private get account() {
    return this.getAttribute("account");
  }
  private get date_element() {
    return this.props.query_by_name("date");
  }
  private get traded_value_element() {
    return this.props.query_by_name("buy_value");
  }
  private get market_value_element() {
    return this.props.query_by_name("market_value");
  }
  private get pl_element() {
    return this.props.query_by_name("pl");
  }
  private get fx_pl_element() {
    return this.props.query_by_name("fx_pl");
  }
  private get position_element() {
    return this.props.query_by_name("position");
  }
  private get broker_element() {
    return this.props.query_by_name("broker");
  }
  private get exchange_element() {
    return this.props.query_by_name("exchange");
  }
}
