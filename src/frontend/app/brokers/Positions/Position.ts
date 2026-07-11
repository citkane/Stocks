import { Transaction } from "./";

export class Position {
  constructor(public instrmnt: filter.instrmnt) {
    this.live = this.shim_live_data();
  }
  public set = {
    transactn: (...transactns: be.transctn[]) => {
      const { transctns_cat: transactns_cat, transactn_ids } = this;
      transactns.forEach((transctn) => {
        const { kind, id } = transctn;
        if (transactn_ids.has(id)) return;
        transactn_ids.add(id);
        transactns_cat[kind].push(new Transaction(transctn, this));
      });
      transactns_cat.buy = transactns_cat.buy.sort(
        (a, b) => a.transctn.price_traded - b.transctn.price_traded,
      );
    },
    live_data: (data: lv.positn) => {
      this.live = this.shim_live_data(data);
    },
  };
  public get transctns() {
    return this.calculate_transctns().map(this.to_root_currency);
  }

  private calculate_transctns = () => {
    const { transctns_cat, live } = this,
      { dividends_yield: div_yield } = live;
    let { buy, sell, dividend, unbooked } = reduce_transctns(),
      sold_total = sum_sales();

    while (sold_total > 0) {
      sell.forEach(balance_sales);
    }

    sell = sell.map(sell_meta);
    buy = buy.map(est_dividend);
    dividend = dividend.map(filter_div_ytd);
    unbooked = unbooked.map(map_unbooked);

    return [...buy, ...sell, ...dividend, ...unbooked];

    function balance_sales(sell: filter.transctn) {
      if (!sell.amount) return;
      const bought = buy.find((buy) => find_buy(buy, sell))!;
      const sold_amount = sell.amount;
      const price_diff = sell.price_traded - bought.price_traded;
      if (bought.amount === sold_amount) {
        sold_total -= sell.amount;
        bought.state = "closed";
        bought.meta.amount = bought.amount * -1;
        bought.amount = 0;
        sell.meta.amount = sell.amount;
        sell.r_pl = price_diff * sell.amount;
        sell.amount = 0;
      } else if (bought.amount > sold_amount) {
        sold_total -= sold_amount;
        bought.meta.amount = (bought.meta.amount || 0) - sell.amount;
        bought.amount -= sell.amount;
        sell.meta.amount = sell.amount;
        sell.r_pl = price_diff * sold_amount;
        sell.amount = 0;
      } else {
        bought.state = "closed";
        sold_total -= bought.amount;
        sell.r_pl += price_diff * bought.amount;
        sell.meta.amount = (sell.meta.amount || 0) + bought.amount;
        sell.amount -= bought.amount;
        bought.meta.amount = bought.amount * -1;
        bought.amount = 0;
      }
    }
    function find_buy(buy: filter.transctn, sell: filter.transctn) {
      return (
        buy.amount > 0 && buy.date < sell.date && buy.broker === sell.broker
      );
    }
    function est_dividend(buy: filter.transctn) {
      const { value_market } = buy;
      if (!div_yield) return buy;
      buy.div_est = Math.round(value_market * (div_yield / 100));
      return buy;
    }
    function filter_div_ytd(div: filter.transctn) {
      const div_year = util.time.year(div.date);
      const this_year = util.time.year();
      if (div_year < this_year) {
        div.meta.dividend = div.dividend;
        div.dividend = 0;
        div.state = "prev_year";
      }
      div.state = "curr_year";
      return div;
    }
    function map_unbooked(un: filter.transctn) {
      un.meta.value_traded = "pending";
      return un;
    }
    function reduce_transctns() {
      const keys = Object.keys(transctns_cat),
        transctns = {} as p.reduced_transctns;
      return keys.reduce((transctns, key) => {
        const kind = key as p.cat_key;
        transctns[kind] = transctns_cat[kind].map((t) => t.transctn);
        return transctns;
      }, transctns);
    }
    function sell_meta(sell: filter.transctn) {
      sell.meta.value_traded = sell.value_traded;
      sell.meta.value_market = sell.value_market;
      sell.value_traded = 0;
      sell.value_market = 0;
      return sell;
    }
    function sum_sales() {
      return sell.reduce((amount, sell) => {
        amount += sell.amount;
        return amount;
      }, 0);
    }
  };
  private shim_live_data = (data?: lv.positn): lv.positn => {
    if (data) return data;
    const { i_id, exchange, currency } = this.instrmnt;
    return {
      i_id,
      exchange,
      current_session: "out_of_session",
      currency,
      dividends_yield: 0,
      open: 0,
      close: 0,
      high: 0,
      low: 0,
      fx: 0,
    };
  };
  private to_root_currency = (transctn: filter.transctn): filter.transctn => {
    let {
        price_traded,
        value_traded,
        fx_traded,
        dividend,
        fractional,
        price_market,
        value_market,
        fx_market,
        kind,
        meta,
        r_pl,
      } = transctn,
      base_ur_pl = 0,
      base_fx_pl = 0,
      base_r_pl = 0,
      base_dividend = 0;

    if (kind === "dividend") {
      price_traded = 0;
      price_market = 0;
      value_traded = 0;
      value_market = 0;
      fx_market = 0;
    }
    const base_price_traded = traded_base(fractional, price_traded, fx_traded);
    const base_value_traded = traded_base(fractional, value_traded, fx_traded);
    const base_price_market = market_base(fractional, price_market, fx_market);
    const base_value_market = market_base(fractional, value_market, fx_market);
    if (kind === "buy" && value_market) {
      const ur_pl = value_market - value_traded;
      base_ur_pl = base_value_market - base_value_traded;
      base_fx_pl = base_ur_pl - market_base(fractional, ur_pl, fx_market);
    }
    if (kind === "sell" && r_pl) {
      base_r_pl = traded_base(fractional, r_pl, fx_traded);
    }
    if (kind === "dividend" && dividend) {
      base_dividend = traded_base(fractional, dividend, fx_traded);
    }
    return Object.freeze({
      ...transctn,
      price_traded: base_price_traded,
      value_traded: base_value_traded,
      price_market: base_price_market,
      value_market: base_value_market,
      dividend: base_dividend,
      ur_pl: base_ur_pl,
      r_pl: base_r_pl,
      fx_pl: base_fx_pl,
      meta,
    });

    function traded_base(fractional: boolean, value: number, fx: number) {
      fx = fx || 1;
      value = value * (fractional ? fx : fx / 100); // Broker fx is inverse of TradingView and does not compensate for non-fractional
      return Math.round(fractional ? value : value * 100);
    }
    function market_base(fractional: boolean, value: number, fx: number) {
      fx = fx || 1;
      value = value / fx; // TradingView fx is inverse of broker and compensates for non-fractional
      return Math.round(fractional ? value : value * 100);
    }
  };

  public live: lv.positn;
  private transactn_ids = new Set<string>();
  private transctns_cat: p.transctn_cat = {
    buy: [],
    sell: [],
    dividend: [],
    unbooked: [],
  };
}

namespace p {
  export type cat_key = filter.transctn["kind"];
  export type transctn_cat = {
    [key in cat_key]: Transaction[];
  };
  export type reduced_transctns = { [key in cat_key]: filter.transctn[] };
}
