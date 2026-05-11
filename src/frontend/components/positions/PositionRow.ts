import { AppElement } from "@frontend/components/AppElement.ts";

export class PositionRow extends AppElement {
  static observedAttributes = ["data-transaction", "data-filter"];

  constructor() {
    super();
    this.dom.template_to_self("position-row");

    this.props.watch("data-transaction", this.handlers.render);
    this.props.watch("data-filter", this.handlers.filter);
    this.props.show();
  }

  private handlers = {
    render: (p: p.prop_callback) => {
      if (p.old === p.new) return;

      delete this._transaction;
      delete this._values;

      const { meta, kind } = this.transaction;
      this.setAttribute("kind", kind);

      Object.keys(this.values).forEach((key) => {
        const k = key as keyof typeof this.values;
        let value = String(this.values[k] || 0);

        const el = this.querySelector(`[name="${key}"]`);
        this.setAttribute(key, value);
        const _value = meta && meta[key];
        if (!!_value) {
          value = String(_value);
          el?.classList.add("meta");
        }
        el?.setAttribute("value", value);
      });
    },

    filter: (p: p.prop_callback) => {
      if (p.old === p.new) return;
      if (this.filter.search) return this.props.show();

      const hide = !!Object.keys(this.source_filter).find((key) => {
        if (key === "a_id" && this.transaction.kind === "dividend")
          return false;
        const val = this.source_filter[key];
        const _val = this.filter[key as f.filter_keys_t];
        return _val !== "all" && _val !== val;
      });
      hide ? this.props.hide() : this.props.show();
    },
  };

  private data = this.api.data({
    values: () => {
      let {
        date,
        amount,
        broker,
        currency,
        price_traded,
        price_market,
        fx_traded,
        fx_market,
        kind,
        dividend,
        r_pl,
      } = this.transaction;

      if (kind === "dividend") {
        const div_year = util.time.year(date);
        const year = util.time.year();
        dividend = div_year < year ? 0 : dividend;
        return {
          date,
          broker,
          amount,
          dividend,
        };
      }
      if (kind === "sell") {
        return {
          date,
          broker,
          amount,
          r_pl,
          traded_value: 0,
        };
      }

      const fx_pl = util.money.fx_pl_base_whole(this.transaction);
      const pl = util.money.pl_base_whole(this.transaction);

      const market_value = util.money.base_whole(
        currency,
        amount,
        price_market,
        fx_market,
      );
      const traded_value = util.money.base_whole(
        currency,
        amount,
        price_traded,
        fx_traded,
      );

      return {
        date,
        broker,
        amount,
        market_value,
        traded_value,
        fx_pl,
        pl,
        r_pl,
      };
    },
  });
  private dom = this.api.dom({});
  private props = this.api.props({});

  private get values() {
    if (this._values) return this._values;
    return (this._values = this.data.values());
  }
  private get source_filter() {
    const { a_id, broker, i_id } = this.transaction;
    const instrument = this.cache.get.instrument(i_id);
    const { asset_sector, asset_industry } = instrument;

    return { a_id, broker, asset_sector, asset_industry } as {
      [key: string]: string;
    };
  }
  private get transaction() {
    if (!!this._transaction) return this._transaction;
    let transaction = util.html.json_parse<transctn_t>(
      this.dataset.transaction!,
    );
    return (this._transaction = transaction);
  }

  private _transaction?: transctn_t;
  private _values?: ReturnType<typeof this.data.values>;
}
