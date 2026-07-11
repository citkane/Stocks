import {
  type BalanceRow,
  type AccountRow,
  type AccountsBroker,
  InstrumentRow,
  TransctnRow,
} from "@frontend/components";

export class Money {
  public static transctns = {
    categorise: this.categorise_transctns,
    calculate: this.calculate_transctns,
  };
  public static instrmnts = {
    empty_tally: empty_collector,
    tally: this.tally_instrmnts,
    assign: this.assign_instrmts,
  };
  public static live = {
    instrmnt: (instrmnt: filter.instrmnt, data?: lv.positn): lv.positn => {
      if (data) return data;

      const { exchange, currency, i_id } = instrmnt;
      return {
        i_id,
        exchange,
        currency,
        current_session: "out_of_session",
        dividends_yield: 0,
        open: 0,
        close: 0,
        high: 0,
        low: 0,
        fx: 0,
      };
    },
    account: (accnt: filter.account, data?: lv.balance): lv.balance => {
      if (data) return data;

      const { currency, a_id } = accnt;
      return {
        a_id,
        currency,
        assets_val: 0,
        cash: 0,
        fx: 0,
      };
    },
  };
  public static base = {
    transactn_empty: (part?: Partial<filter.base_transction>) => {
      return {
        ...{
          price_traded: 0,
          price_market: 0,
          dividend: 0,
          div_yield: 0,
          amount: 0,
          r_pl: 0,
          u_pl: 0,
          div_est: 0,
          fx_pl: 0,
        },
        ...(part || {}),
      };
    },
    transctn: (transctn: filter.transctn): filter.base_transction => {
      const { fx, close, dividends_yield } = transctn.live;
      const { price_traded, kind, amount, fx_traded } = transctn;
      const base_price_traded = price_traded * fx_traded;
      const base_price_market = fx ? close / fx : 0;
      return this.base.transactn_empty({
        price_traded: base_price_traded,
        price_market: base_price_market,
        dividend: kind === "dividend" ? base_price_market : 0,
        div_yield: dividends_yield,
        amount: kind === "dividend" ? 1 : amount || 0,
      });
    },
    accnt: (accnt: filter.account): filter.base_accnt => {
      const { fx, cash, assets_val } = accnt.live;
      return {
        assets_val: fx ? assets_val / fx : 0,
        cash: fx ? cash / fx : 0,
      };
    },
  };

  private static categorise_transctns(transactions: filter.transctn[]) {
    return transactions.reduce(
      (c, transaction) => {
        const { kind } = transaction;
        c[`${kind}s`].push(transaction);
        return c;
      },
      { buys: [], sells: [], dividends: [], unbookeds: [] } as filter.positn,
    );
  }
  private static calculate_transctns(positn: filter.positn) {
    positn = calculate_positn(positn);
    let { buys, sells, unbookeds, dividends } = positn;

    buys = buys.map((buy) => {
      //buy.trnsctn.meta = {};
      //const { accum, trnsctn } = buy;
      const { meta, amount, base } = buy;
      if (base.state === "closed") {
        base.amount = amount * -1;
        meta.amount = "closed";
        meta.sales = amount * -1;
        meta.value_market = "-";
        meta.value_traded = "-";

        return buy;
      }

      if (base.amount) {
        meta.sales = base.amount - amount;
        if (!meta.sales) meta.sales = "-";
        buy.amount = base.amount;
      }
      //return buy(trnsctn);
      return buy;
    });
    sells = sells.map((sell) => {
      //sell.trnsctn.meta = {};
      //const { trnsctn, accum } = sell;
      const { meta, amount, base } = sell;
      base.amount = Math.abs(amount);
      meta.sales = amount;
      meta.amount = "-";
      meta.value_traded = "-";
      meta.value_market = "-";

      //base.r_pl = trnsctn.r_pl
      //  ? base.price_traded //util.money.base_whole("XXX", 1, meta.r_pl, fx_traded)
      //  : 0;

      return sell;
    });
    unbookeds = unbookeds.map((un) => {
      //un.meta = {};
      const { meta } = un;
      meta.amount = "unbooked";
      meta.value_traded = "pending";
      return un;
    });
    dividends = dividends.map((div) => {
      const div_year = util.time.year(div.date);
      const this_year = util.time.year();
      //div.meta = {};
      const { meta, base } = div;
      meta.amount = "1";
      base.dividend = base.price_traded;
      //util.money.base_whole(
      //  currency,
      //  amount,
      //  price_traded,
      //  fx_traded,
      //);
      div.amount = 0;
      if (div_year < this_year) {
        meta.dividend = base.dividend / 100;
        base.dividend = 0;
      }
      return div;
    });

    return [...buys, ...sells, ...dividends, ...unbookeds];
  }
  private static tally_instrmnts(rows: (InstrumentRow | TransctnRow)[]) {
    const tally = empty_collector();
    rows.forEach((row) => {
      tally.market_value += row.els_money.market?.money_value || 0;
      tally.traded_value += row.els_money.traded?.money_value || 0;
      tally.r_pl += row.els_money.r_pl?.money_value || 0;
      tally.u_pl += row.els_money.u_pl?.money_value || 0;
      tally.dividend += row.els_money.dividend?.money_value || 0;
      tally.div_est += row.els_money.div_est?.money_value || 0;
      tally.fx_pl += row.els_money.fx_pl?.money_value || 0;
    });
    return tally;
  }
  private static tally_accounts<
    T extends AccountsBroker | AccountRow | BalanceRow,
  >(rows: ArrayIterator<T>) {
    return rows.reduce(
      (c, row) => {
        c.cash += row.els_money.cash.money_value;
        c.assets_val += row.els_money.assets.money_value;
        c.total = c.cash + c.assets_val;
        return c;
      },
      { cash: 0, assets_val: 0, total: 0 },
    );
  }
  private static assign_instrmts(
    els_money: filter.money_instruments_t,
    tally: filter.instrmnt_collector,
    instrmnt?: filter.instrmnt,
  ) {
    const live_yield = instrmnt?.live.dividends_yield;
    const div_yield =
      live_yield || (tally.div_est! / tally.market_value!) * 100;
    const div_est = live_yield
      ? util.money.div_est(tally.market_value, live_yield)
      : tally.div_est;
    const percent_pl = util.money.percent_pl(
      tally.traded_value,
      tally.market_value,
    );
    els_money.market.money_value = tally.market_value;
    els_money.traded.money_value = tally.traded_value;
    els_money.r_pl.money_value = tally.r_pl;
    els_money.u_pl.money_value = tally.u_pl;
    els_money.fx_pl.money_value = tally.fx_pl;
    els_money.dividend.money_value = tally.dividend;
    els_money.div_est.money_value = div_est;
    els_money.div_yield.value = div_yield;
    els_money.percent_u_pl.value = percent_pl;
  }

  public static unbooked_transctn = (i_id: id.i): filter.transctn => {
    const instrmnt = frontend.cache.get.instrument(i_id)!;
    const { saxo_id, live } = instrmnt;
    const broker = saxo_id ? "saxo" : "ibkr";
    const a_id = "unknown";
    const currency = "XXX";
    const amount = 0;
    const date = util.time.ms_now();
    const price_traded = 0;
    const fx_traded = 0;
    const id = util.random_context();

    return {
      kind: "unbooked",
      id,
      i_id,
      broker,
      a_id,
      currency,
      amount,
      date,
      price_traded,
      fx_traded,
      live,
      base: this.base.transactn_empty(),
      meta: {},
    };
  };
}

function aggregate_position(position: filter.positn) {
  let { buys, sells } = structuredClone(position);
  if (!sells.length) return [...buys];

  const transctns = [...buys, ...sells].sort((a, b) => a.date - b.date);
  let sold = 0;

  return transctns.reduce((c, transaction) => {
    const { kind, amount } = transaction;

    if (kind === "sell") {
      sold += Math.abs(amount);
      const match = transctns.find((t) => t.kind === "buy" && t.amount > 0)!;
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
  }, [] as filter.transctn[]);
}

function calculate_positn(positn: filter.positn) {
  positn = structuredClone(positn);

  let { buys, sells } = positn;
  if (!sells.length) return positn;

  buys = buys
    .sort((a, b) => a.price_traded! - b.price_traded!)
    .map((buy) => {
      buy.base.state = "open";
      return buy;
    });
  //sells = sells.map((sell) => {
  //  sell.accum.sales = sell.trnsctn.amount;
  //  sell.trnsctn.r_pl = 0;
  //  return sell;
  //});

  let sell_total = sells.reduce((c, sell) => {
    c += Math.abs(sell.amount);
    return c;
  }, 0);

  while (sell_total > 0) {
    sells.forEach((sell) => {
      if (!sell.base.amount) return;
      const buy = buys.find(
        (buy) =>
          buy.base.amount > 0 &&
          buy.date < sell.date &&
          buy.broker === sell.broker,
      )!;
      const sell_amount = Math.abs(sell.base.amount);
      const price_pl = sell.base.price_traded! - buy.base.price_traded!;
      if (buy.base.amount === sell_amount) {
        buy.base.state = "closed";
        sell_total -= sell_amount;

        buy.base.amount = 0;
        sell.base.r_pl = price_pl * sell_amount;
        sell.base.amount = 0;
      } else if (buy.base.amount! > sell_amount) {
        sell_total -= sell_amount;

        buy.base.amount! -= sell_amount;
        sell.base.r_pl = price_pl * sell_amount;
        sell.base.amount = 0;
      } else {
        buy.base.state = "closed";
        sell_total -= buy.base.amount;

        sell.base.r_pl! += price_pl * buy.base.amount;
        sell.base.amount += buy.base.amount;
        buy.base.amount = 0;
      }
    });
  }
  return positn;
}
//function wrap_transctn(transctn: fe.transctn): wrapped_transctn {
//  return { accum: { sales: 0 }, trnsctn: transctn };
//}

//function buy(transaction: fe.transctn): fe.transctn {
//  const { currency, amount, price_market, fx_market, price_traded, fx_traded } =
//    transaction;
//  const fx_pl = util.money.fx_pl_base_whole(transaction);
//  const u_pl = util.money.u_pl_base_whole(transaction);
//  const market_value = util.money.base_whole(
//    currency,
//    amount,
//    price_market,
//    fx_market,
//  );
//  const traded_value = util.money.base_whole(
//    currency,
//    amount,
//    price_traded,
//    fx_traded,
//  );
//
//  transaction.meta = {
//    ...(transaction.meta || {}),
//    ...{
//      market_value,
//      traded_value,
//      fx_pl,
//      u_pl,
//    },
//  };
//
//  return transaction;
//}

function empty_collector() {
  return {
    market_value: 0,
    traded_value: 0,
    r_pl: 0,
    u_pl: 0,
    fx_pl: 0,
    div_est: 0,
    dividend: 0,
  };
}
//type wrapped_transctn = {
//  accum: { sales: number; state?: "closed" | "open" };
//  trnsctn: fe.transctn;
//};
declare global {
  namespace filter {
    type instrmnt_collector = ReturnType<typeof empty_collector>;
  }
}
