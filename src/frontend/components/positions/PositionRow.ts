import { WebComponent } from "@frontend/components/common/index";
import { AnyString, DateString } from "@frontend/components";

export class PositionRow extends WebComponent {
  static observedAttributes = ["data-transaction", "data-filter"];

  constructor() {
    super();
    this.dom.template_to_self("position-row");
    this.props.watch("data-transaction", this.handlers.render);
    this.props.watch("data-filter", this.handlers.filter);
    this.props.show();
    this.dom.define_selectors();
  }

  private handlers = {
    render: (p: p.prop_callback) => {
      if (p.old === p.new) return;

      delete this._transaction;
      const { amount, r_pl, dividend, date, broker, meta, kind } =
        this.transaction;
      const {
        dividend: meta_dividend,
        amount: meta_amount,
        u_pl,
        fx_pl,
        traded_value,
        market_value,
        sales,
      } = meta!;
      if (market_value) this.els_money.market.money_value = market_value;
      if (traded_value) this.els_money.traded.money_value = traded_value;
      if (dividend) this.els_money.dividend.money_value = dividend;
      if (u_pl) this.els_money.u_pl.money_value = u_pl;
      if (fx_pl) this.els_money.fx_pl.money_value = fx_pl;
      if (r_pl) this.els_money.r_pl.money_value = r_pl;

      if (!dividend && meta_dividend) this.sales_el.value = meta_dividend;
      if (sales) this.sales_el.value = sales;
      this.amount_el.value = meta_amount !== undefined ? meta_amount : amount;
      this.kind_el.value = kind;
      this.date_el.value = date;
      this.broker_el.value = broker;
    },

    filter: (p: p.prop_callback) => {
      if (p.old === p.new) return;

      const hide = !!Object.keys(this.source_filter).find((key) => {
        //if (key === "a_id" && this.transaction.kind === "dividend")
        //  return false;
        const source_val = this.source_filter[key as filter_keys_t];
        const val = this.cache.filter[key as filter_keys_t];
        return val !== "all" && val !== source_val;
      });
      hide ? this.props.hide() : this.props.show();
    },
  };
  private dom = this.api.dom({
    define_selectors: () => {
      this.date_el = this.querySelector<DateString>(`[name="date"]`)!;
      this.broker_el = this.querySelector<AnyString>(`[name="broker"]`)!;
      this.sales_el = this.querySelector<AnyString>(`[name="sales"]`)!;
      this.kind_el = this.querySelector<AnyString>(`[name="kind"]`)!;
      this.amount_el = this.querySelector<AnyString>(`[name="amount"]`)!;
      this.els_money = this.selector.money.instruments(this);
    },
  });
  private props = this.api.props({});

  private get source_filter(): filter_t {
    if (!!this._source_filter) return this._source_filter;

    const { a_id, broker, i_id } = this.transaction;
    const instrument = this.cache.get.instrument(i_id);
    const { asset_sector, asset_industry } = instrument;
    return (this._source_filter = {
      a_id,
      broker,
      asset_sector,
      asset_industry,
    });
  }
  private get transaction() {
    if (!!this._transaction) return this._transaction;
    let transaction = util.html.json_parse<transctn_t>(
      this.dataset.transaction!,
    );
    return (this._transaction = transaction);
  }

  private date_el!: DateString;
  private broker_el!: AnyString;
  private sales_el!: AnyString;
  private kind_el!: AnyString;
  private amount_el!: AnyString;
  public els_money!: ReturnType<typeof this.selector.money.instruments>;

  private _transaction?: transctn_t;
  private _source_filter?: filter_t;
}

type filter_t = Omit<f.filter_t, "search">;
type filter_keys_t = Exclude<f.filter_keys_t, "search">;
