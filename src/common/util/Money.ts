const money_round = 100;
const fx_round = 1000000;

export class Money {
  public normalise_minor_unit = (transctn: transctn_t) => {
    let { currency, price_traded, price_market } = transctn;
    if (!["ZAR", "ZAC", "GBP", "GPX"].includes(currency.toUpperCase()))
      return transctn;
    price_traded = price_traded / 100;
    price_market = price_market ? price_market / 100 : undefined;
    return { ...transctn, ...{ price_market, price_traded } };
  };
  /**
   * Calculates total Profit/Loss
   * @param transaction
   * @returns Total P/L in base currency whole number
   */
  public pl_base_whole = (transaction: transctn_t) => {
    let { amount, price_traded, price_market, fx_traded, fx_market } =
      transaction;
    if (!amount || !price_traded || !fx_market || !price_market || !fx_traded)
      return 0;

    price_market = this.whole_money(price_market);
    price_traded = this.whole_money(price_traded);
    const price_diff = price_market - price_traded;

    return this.base_money_whole(amount, price_diff / 100, fx_market);
  };
  public percent_pl = (traded: number, market: number) => {
    if (!traded || !market) return 0;
    return ((market - traded) / traded) * 100;
  };
  /**
   * Calculates fx Profit/Loss
   * @param transaction
   * @returns Fx P/L in base currency whole number
   */
  public fx_pl_base_whole = (transaction: transctn_t) => {
    const { amount, price_traded, price_market, fx_traded, fx_market } =
      transaction;
    if (!amount || !price_traded || !fx_market || !price_market || !fx_traded)
      return 0;

    const traded_base_value = this.base_money_whole(
      amount,
      price_traded,
      fx_traded,
    );
    const market_base_value = this.base_money_whole(
      amount,
      price_traded,
      fx_market,
    );

    return market_base_value - traded_base_value;
  };
  /**
   * Convert money by exchange rate
   * @param amount
   * @param price
   * @param fx_rate
   * @returns Money value in whole number
   */
  public base_money_whole = (
    amount?: number,
    price?: number,
    fx_rate?: number,
  ) => {
    if (!amount || !price || !fx_rate) return 0;
    price = this.whole_money(price);
    fx_rate = this.round_fx(fx_rate);
    return Math.round(amount * price * fx_rate);
  };
  /**
   * Money value in whole number
   * @param value
   * @returns
   */
  public whole_money = (value: number) => {
    return Math.round(value * money_round);
  };
  public round_fx = (rate: number) => {
    return Math.round(rate * fx_round) / fx_round;
  };
  public position = (transactions: transctn_t[]) => {
    return transactions.reduce(
      (c, transaction) => {
        const { kind } = transaction;
        c[`${kind}s`].push(transaction);
        return c;
      },
      { buys: [], sells: [], dividends: [] } as f.positn_t,
    );
  };
  public div_est = (market_val_cents: number, yield_perc: number) => {
    return Math.round((yield_perc / 100) * market_val_cents);
  };
  public aggregate_position = (position: f.positn_t) => {
    let { buys, sells } = structuredClone(position);
    if (!sells.length) return [...buys];

    const tctns = [...buys, ...sells].sort((a, b) => a.date - b.date);
    let sold = 0;

    return tctns.reduce((c, transaction) => {
      const { kind, amount } = transaction;

      if (kind === "sell") {
        sold += Math.abs(amount);
        const match = tctns.find((t) => t.kind === "buy" && t.amount > 0)!;
        const bought = match.amount;
        if (bought >= sold) {
          match.amount -= sold;
          sold = 0;
        } else {
          match.amount = 0;
          sold -= bought;
        }
      } else {
        c.push(transaction);
      }

      return c;
    }, [] as transctn_t[]);
  };

  public calculate_transctns = (positn: f.positn_t) => {
    positn = structuredClone(positn);
    const _positn = this.calculate_position(positn);

    const buys = _positn.buys.map((b) => {
      b.tr.meta = {};
      if (b.acc.state === "closed") {
        b.tr.meta.traded_value = this.base_money_whole(
          b.tr.amount,
          b.tr.price_traded,
          b.tr.fx_traded,
        );
        b.acc.sales = b.tr.amount * -1;
        b.tr.amount = 0;
        b.tr.meta.amount = "closed";
        b.tr.meta.pl = "-";
        b.tr.meta.fx_pl = "-";
        b.tr.meta.market_value = "-";

        return b.tr;
      }

      if (b.acc.sales) {
        b.tr.meta.sales = b.acc.sales - b.tr.amount;
        if (!b.tr.meta.sales) b.tr.meta.sales = "-";
        b.tr.amount = b.acc.sales;
      }
      return b.tr;
    });
    const sells = _positn.sells.map((s) => {
      s.tr.meta = {};
      s.acc.sales = Math.abs(s.tr.amount);
      s.tr.meta.amount = "sell";
      s.tr.meta.traded_value = this.base_money_whole(
        s.tr.amount,
        s.tr.price_traded,
        s.tr.fx_traded,
      );
      s.tr.r_pl = s.tr.r_pl
        ? this.base_money_whole(1, s.tr.r_pl, s.tr.fx_traded)
        : 0;

      return s.tr;
    });

    const dividends = _positn.dividends.map((d) => {
      d.meta = {};
      d.meta.amount = "dividend";
      d.dividend = util.money.base_money_whole(
        d.amount,
        d.price_traded,
        d.fx_traded,
      );
      return d;
    });

    return [...buys, ...sells, ...dividends];
  };
  private calculate_position = (positn: f.positn_t) => {
    const _positn = {
      buys: positn.buys.map((b) => wrap_transctn(b)),
      sells: positn.sells.map((s) => wrap_transctn(s)),
      dividends: positn.dividends,
    };
    if (!_positn.sells.length) return _positn;

    _positn.buys = _positn.buys
      .sort((a, b) => a.tr.price_traded! - b.tr.price_traded!)
      .map((buy) => {
        buy.acc.sales = buy.tr.amount;
        buy.acc.state = "open";
        return buy;
      });
    _positn.sells = _positn.sells.map((sell) => {
      sell.acc.sales = sell.tr.amount;
      sell.tr.r_pl = 0;
      return sell;
    });

    let sell_total = _positn.sells.reduce((c, sell) => {
      c += Math.abs(sell.tr.amount);
      return c;
    }, 0);

    while (sell_total > 0) {
      _positn.sells.forEach((sell) => {
        if (!sell.acc.sales) return;
        const buy = _positn.buys.find(
          (buy) => buy.acc.sales! > 0 && buy.tr.date < sell.tr.date,
        )!;
        const sell_amount = Math.abs(sell.acc.sales);
        const price_pl = sell.tr.price_traded! - buy.tr.price_traded!;
        if (buy.acc.sales! === sell_amount) {
          buy.acc.state = "closed";
          sell_total -= sell_amount;

          buy.acc.sales = 0;
          sell.tr.r_pl = price_pl * sell_amount;
          sell.acc.sales = 0;
        } else if (buy.acc.sales! > sell_amount) {
          sell_total -= sell_amount;

          buy.acc.sales! -= sell_amount;
          sell.tr.r_pl = price_pl * sell_amount;
          sell.acc.sales = 0;
        } else {
          buy.acc.state = "closed";
          sell_total -= buy.acc.sales!;

          sell.tr.r_pl! += price_pl * buy.acc.sales!;
          sell.acc.sales += buy.acc.sales!;
          buy.acc.sales = 0;
        }
      });
    }
    return _positn;
  };
}

function wrap_transctn(transctn: transctn_t): wrapped_transctn {
  return { acc: { sales: 0 }, tr: transctn };
}
type wrapped_transctn = {
  acc: { sales: number; state?: "closed" | "open" };
  tr: transctn_t;
};
