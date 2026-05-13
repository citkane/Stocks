import {
  type BalanceRow,
  type AccountRow,
  type AccountsBroker,
  InstrumentRow,
  PositionRow,
} from "@frontend/components";
import { Selector } from "./Selector";

export class Money extends Selector {
  constructor() {
    super();
  }
  protected money = {
    accounts: {
      tally: <T extends AccountsBroker | AccountRow | BalanceRow>(
        rows: ArrayIterator<T>,
      ) => {
        return rows.reduce(
          (c, row) => {
            c.cash += row.els_money.cash.money_value;
            c.assets_val += row.els_money.assets.money_value;
            c.total = c.cash + c.assets_val;
            return c;
          },
          { cash: 0, assets_val: 0, total: 0 },
        );
      },
    },
    instruments: {
      collector: empty_collector,
      tally: (rows: ArrayIterator<InstrumentRow> | PositionRow[]) => {
        const tally = this.money.instruments.collector();
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
      },
      assign: (
        els_money: f.money_instruments_t,
        tally: f.instrmnt_collector_t,
        instrmnt?: instrmnt_t,
      ) => {
        const div_yield =
          instrmnt?.div_yield || (tally.div_est! / tally.market_value!) * 100;
        const div_est = instrmnt?.div_yield
          ? util.money.div_est(tally.market_value, instrmnt.div_yield)
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
      },
    },
    positions: {
      calculate_transctns,
      position,
    },
    chart: {
      aggregate_position,
      position,
    },
  };

  public static unbooked_transctn = (i_id: i_id_t): transctn_t => {
    const instrmnt = frontend.cache.get.instrument(i_id)!;
    const { saxo_id, ibkr_id } = instrmnt;
    const p_id: p_id_t = saxo_id ? `saxo_${saxo_id}` : `ibkr_${ibkr_id}`;
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
      p_id,
      i_id,
      broker,
      a_id,
      currency,
      amount,
      date,
      price_traded,
      fx_traded,
    };
  };
}

function aggregate_position(position: f.positn_t) {
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
}
function position(transactions: transctn_t[]) {
  return transactions.reduce(
    (c, transaction) => {
      const { kind } = transaction;
      c[`${kind}s`].push(transaction);
      return c;
    },
    { buys: [], sells: [], dividends: [], unbookeds: [] } as f.positn_t,
  );
}
function calculate_transctns(positn: f.positn_t) {
  positn = structuredClone(positn);
  const _positn = calculate_position(positn);

  const buys = _positn.buys.map((b) => {
    b.trnsctn.meta = {};
    if (b.accum.state === "closed") {
      b.accum.sales = b.trnsctn.amount * -1;
      b.trnsctn.meta.amount = "closed";
      b.trnsctn.meta.sales = b.trnsctn.amount * -1;
      b.trnsctn.meta.market_value = "-";
      b.trnsctn.meta.traded_value = "-";

      return b.trnsctn;
    }

    if (b.accum.sales) {
      b.trnsctn.meta.sales = b.accum.sales - b.trnsctn.amount;
      if (!b.trnsctn.meta.sales) b.trnsctn.meta.sales = "-";
      b.trnsctn.amount = b.accum.sales;
    }
    return buy(b.trnsctn);
  });
  const sells = _positn.sells.map((s) => {
    s.trnsctn.meta = {};
    s.accum.sales = Math.abs(s.trnsctn.amount);
    s.trnsctn.meta.sales = s.trnsctn.amount;
    s.trnsctn.meta.amount = "-";
    s.trnsctn.meta.traded_value = "-";
    s.trnsctn.meta.market_value = "-";

    s.trnsctn.r_pl = s.trnsctn.r_pl
      ? util.money.base_whole("XXX", 1, s.trnsctn.r_pl, s.trnsctn.fx_traded)
      : 0;

    return s.trnsctn;
  });
  const unbooked = _positn.unbooked.map((un) => {
    un.meta = {};
    un.meta.amount = "unbooked";
    un.meta.traded_value = "pending";
    return un;
  });
  const dividends = _positn.dividends.map((d) => {
    const div_year = util.time.year(d.date);
    const this_year = util.time.year();

    d.meta = {};
    d.meta.amount = "1";
    d.dividend = util.money.base_whole(
      d.currency,
      d.amount,
      d.price_traded,
      d.fx_traded,
    );
    d.amount = 0;
    if (div_year < this_year) {
      d.meta.dividend = d.dividend / 100;
      delete d.dividend;
    }
    return d;
  });

  return [...buys, ...sells, ...dividends, ...unbooked];
}
function calculate_position(positn: f.positn_t) {
  const _positn = {
    buys: positn.buys.map((b) => wrap_transctn(b)),
    sells: positn.sells.map((s) => wrap_transctn(s)),
    dividends: positn.dividends,
    unbooked: positn.unbookeds,
  };
  if (!_positn.sells.length) return _positn;

  _positn.buys = _positn.buys
    .sort((a, b) => a.trnsctn.price_traded! - b.trnsctn.price_traded!)
    .map((buy) => {
      buy.accum.sales = buy.trnsctn.amount;
      buy.accum.state = "open";
      return buy;
    });
  _positn.sells = _positn.sells.map((sell) => {
    sell.accum.sales = sell.trnsctn.amount;
    sell.trnsctn.r_pl = 0;
    return sell;
  });

  let sell_total = _positn.sells.reduce((c, sell) => {
    c += Math.abs(sell.trnsctn.amount);
    return c;
  }, 0);

  while (sell_total > 0) {
    _positn.sells.forEach((sell) => {
      if (!sell.accum.sales) return;
      const buy = _positn.buys.find(
        (buy) =>
          buy.accum.sales! > 0 &&
          buy.trnsctn.date < sell.trnsctn.date &&
          buy.trnsctn.broker === sell.trnsctn.broker,
      )!;
      const sell_amount = Math.abs(sell.accum.sales);
      const price_pl = sell.trnsctn.price_traded! - buy.trnsctn.price_traded!;
      if (buy.accum.sales! === sell_amount) {
        buy.accum.state = "closed";
        sell_total -= sell_amount;

        buy.accum.sales = 0;
        sell.trnsctn.r_pl = price_pl * sell_amount;
        sell.accum.sales = 0;
      } else if (buy.accum.sales! > sell_amount) {
        sell_total -= sell_amount;

        buy.accum.sales! -= sell_amount;
        sell.trnsctn.r_pl = price_pl * sell_amount;
        sell.accum.sales = 0;
      } else {
        buy.accum.state = "closed";
        sell_total -= buy.accum.sales!;

        sell.trnsctn.r_pl! += price_pl * buy.accum.sales!;
        sell.accum.sales += buy.accum.sales!;
        buy.accum.sales = 0;
      }
    });
  }
  return _positn;
}
function wrap_transctn(transctn: transctn_t): wrapped_transctn {
  return { accum: { sales: 0 }, trnsctn: transctn };
}

function buy(transaction: transctn_t): transctn_t {
  const { currency, amount, price_market, fx_market, price_traded, fx_traded } =
    transaction;
  const fx_pl = util.money.fx_pl_base_whole(transaction);
  const u_pl = util.money.u_pl_base_whole(transaction);
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

  transaction.meta = {
    ...(transaction.meta || {}),
    ...{
      market_value,
      traded_value,
      fx_pl,
      u_pl,
    },
  };

  return transaction;
}

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
type wrapped_transctn = {
  accum: { sales: number; state?: "closed" | "open" };
  trnsctn: transctn_t;
};
declare global {
  namespace f {
    type instrmnt_collector_t = ReturnType<typeof empty_collector>;
  }
}
