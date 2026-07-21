import { Global } from "@backend/Global";

export class Positions extends Global {
  public update = {
    lv_positns: async (
      metas: g.meta[],
      fx: lv.forex[],
      lv_instrmnts: lv.instrmnt[],
    ): Promise<lv.positn[]> => {
      const { positn, transctn, frmt } = this;
      //lv_forex ??= await update.lv_forex(metas);
      //lv_instrmnts ??= await this.tv.live_instrmnts(metas);

      const forex_map = frmt.map_forex(fx),
        meta_map = frmt.map_pid(metas),
        instrmnt_map = frmt.map_pid(lv_instrmnts);

      return frmt
        .fill_missing_instrmnts(meta_map, instrmnt_map)
        .then((instrmnts) => positn.to_live_positns(instrmnts, forex_map))
        .then(transctn.to_live_transcns)
        .then(frmt.de_null);
    },
    lv_instrmnts: async (metas: g.meta[]) => {
      return this.tv.live_instrmnts(metas);
    },
    lv_forex: async (currencies: string[]) => {
      const { tv, frmt, root_currency } = this;
      return tv
        .forex(root_currency, currencies)
        .then((forex) => frmt.add_root_fx(forex, root_currency));
    },
    // lv_balances: (balances: lv.balance[], forex: lv.forex[]) => {
    //   const { frmt } = this;
    //   const forex_map = frmt.map_forex(forex);
    //   return balances.map((balance) => {
    //     let { currency } = balance;
    //     const fx = forex_map[currency]!;
    //   });
    // },
  };
  private frmt = {
    map_forex: (forex: lv.forex[]) => {
      return Object.fromEntries(forex.map((f) => [f.currency, f]));
    },
    map_pid: <T extends lv.positn | g.meta | lv.transctn | lv.instrmnt>(
      list: T[],
    ): { [p_id: id.p]: T } => {
      return Object.fromEntries(list.map((p) => [p.p_id, p]));
    },
    add_root_fx: (forex: lv.forex[], root_currency: string) => {
      const root_fx = {
        currency: root_currency,
        open: 1,
        close: 1,
        exchange: "MOOT",
      };
      forex.push(root_fx);
      return forex;
    },
    de_null: <T>(val: T): T => {
      if (val === null) return undefined as unknown as T;
      if (typeof val !== "object") return val;

      const { frmt } = this;
      if (Array.isArray(val)) return val.map(frmt.de_null) as T;
      return Object.fromEntries(
        Object.entries(val).map(([k, v]) => [
          k,
          frmt.de_null(v) as typeof v | undefined,
        ]),
      ) as T;
    },
    fill_missing_instrmnts: async (
      metas: p.pid_map<g.meta>,
      instrmnts: p.pid_map<lv.instrmnt>,
    ) => {
      const i = Object.keys(instrmnts);

      const missing_pids = Object.keys(metas).filter(
        (m) => !i.includes(m),
      ) as id.p[];

      missing_pids.forEach((p_id) => {
        const { exchange, currency } = metas[p_id]!;
        instrmnts[p_id] = {
          p_id,
          exchange,
          currency,
          open: 0,
          close: 0,
          high: 0,
          low: 0,
          current_session: "no longer traded" as tv.fields.session,
        };
      });

      return instrmnts;
    },
  };
  /*
  private get = {
    lv_trnsctns_map: async (
      metas: g.meta[],
      postns_map: p.positns_map,
      root_currency: string,
    ) => {
      const { fx, lv_transctn: trctn, get } = this;

      return Promise.all(
        metas.map((meta) => get.lv_trnsctns(meta, postns_map, root_currency)),
      );
      //  .then((trnscns) =>
      //    trnscns.map((ts) => fx.convert_transctns(ts, root_currency)),
      //  )
      //.then(trctn.to_i_id_map);
    },
    lv_trnsctns: async (
      meta: g.meta,
      postns_map: p.positns_map,
      root_currency: string,
    ) => {
      const { lv_transctn: trctn } = this;
      const { p_id } = meta;
      let postn = postns_map[p_id];
      postn = postn?.base_instrmnt || postn;
      postn ??= this.lv_positn.dummy_postn(meta, root_currency);

      return this.db.select
        .transctns(["p_id", p_id], undefined, ["date", "DESC"])
        .then((tns) => tns.map((tn) => trctn.to_lv_transctn(tn, postn)))
        .then(trctn.to_positn_value)
        .then((tns) => [p_id, tns] as const);
    },
  };
  */
  private positn = {
    to_live_positns: async (
      live_instrmnts: p.pid_map<lv.instrmnt>,
      forex_map: p.forex_map,
    ): Promise<p.pid_map<lv.positn>> => {
      const { positn: lv_positn } = this;
      const entries = Object.entries(live_instrmnts).map(([p_id, i]) => {
        const postn = lv_positn.to_live_postn(i, forex_map);
        return [p_id as id.p, postn];
      });
      return Object.fromEntries(entries);
    },
    to_live_postn: (
      lv_instrmnt: lv.instrmnt,
      forex_map: p.forex_map,
    ): pos.live => {
      const { money } = util;
      const {
        p_id,
        current_session,
        currency,
        exchange,
        dividends_yield: div_yield,
        close: market_price,
        open: market_open,
        high: market_high,
        low: market_low,
      } = lv_instrmnt;
      const market_fx = forex_map[currency]?.close || 1;
      return {
        p_id,
        exchange,
        currency: this.root_currency,
        current_session,
        div_yield: div_yield || 0,
        transctns: [],
        base: {
          currency,
          fractional: money.is_fractional(currency),
          market_price,
          market_open,
          market_high,
          market_low,
          market_fx,
        },
      };
    },
  };
  private transctn = {
    to_live_transcns: async (
      postns: p.pid_map<lv.positn>,
    ): Promise<lv.positn[]> => {
      const { transctn, db } = this;
      const entries = Object.entries(postns);
      const promises = entries.map(([p_id, positn]) =>
        db.select.transctns
          .data(["p_id", p_id], undefined, ["date", "DESC"])
          .then((tranctns) => to_live_transctns(tranctns, positn))
          .then(transctn.calculate_positn),
      );

      return Promise.all(promises);

      function to_live_transctns(transctns: g.transctn_v[], positn: lv.positn) {
        positn.transctns = transctns.map((t) =>
          transctn.to_lv_transctn(t, positn),
        );
        return positn;
      }
    },
    to_lv_transctn: (
      transctn: g.transctn_v,
      positn: lv.positn,
    ): lv.transctn => {
      transctn = Object.freeze(transctn);
      let { currency: market_currency, market_price, market_fx } = positn.base;
      let { currency, traded_price, traded_fx, amount } = transctn;
      const { broker, date, a_id, i_id, p_id, id, kind } = transctn;
      currency = util.money.patch_currency(currency);
      if (market_currency === "XXX") market_currency = currency;
      if (kind === "dividend" && currency !== market_currency) {
        currency = market_currency;
        traded_price = traded_price * traded_fx;
        traded_fx = 1;
      }
      if (currency !== market_currency) {
        throw `currency mismatch ${currency}:${market_currency}`;
      }

      if (kind === "dividend" || kind == "sell") {
        market_price = 0;
        market_fx = 0;
      }

      return {
        a_id,
        i_id,
        p_id,
        id,
        kind,
        broker,
        date,
        currency: this.root_currency,
        amount: Math.abs(amount),
        market_value: 0,
        traded_value: 0,
        div_value: 0,
        pl_fx: 0,
        pl_ur: 0,
        pl_r: 0,
        state: transctn_state(transctn),
        base: Object.freeze({
          a_id,
          currency,
          amount,
          traded_price,
          traded_fx,
          market_price,
          market_fx,
        }),
        meta: {},
      };

      function transctn_state(transctn: g.transctn_v) {
        const { kind, date } = transctn;
        switch (kind) {
          case "buy":
            return "open";
          case "sell":
            return "sold";
          case "dividend":
            const div_year = util.time.year(date);
            const this_year = util.time.year();
            return div_year < this_year ? "prev_year" : "curr_year";
          case "unbooked":
            return "unbooked";
        }
      }
    },
    calculate_positn: (positn: lv.positn) => {
      const { transctns } = positn;
      const { transctn } = this;
      const { buy, sell, dividend, unbooked } = transctn.categorise(transctns);
      let sold_total = sum_sales(sell);

      while (sold_total > 0) {
        sell.forEach(balance_sales);
      }
      return transctn.set_current_a_ids(
        transctn.convert_fx(positn, buy, sell, dividend, unbooked),
      );

      function balance_sales(sell: lv.transctn) {
        if (!sell.amount) return;

        const bought = buy.find((buy) => find_buy(buy, sell))!;
        const sold_amount = sell.amount;
        const price_diff = sell.base.traded_price - bought.base.traded_price;
        if (bought.amount === sold_amount) {
          sold_total -= sell.amount;
          bought.state = "closed";
          bought.meta.amount = bought.amount * -1;
          bought.amount = 0;
          sell.meta.amount = sell.amount;
          sell.pl_r = price_diff * sell.amount;
          sell.amount = 0;
        } else if (bought.amount > sold_amount) {
          sold_total -= sold_amount;
          bought.meta.amount = (Number(bought.meta.amount) || 0) - sell.amount;
          bought.amount -= sell.amount;
          sell.meta.amount = sell.amount;
          sell.pl_r = price_diff * sold_amount;
          sell.amount = 0;
        } else {
          bought.state = "closed";
          sold_total -= bought.amount;
          sell.pl_r += price_diff * bought.amount;
          sell.meta.amount = (Number(sell.meta.amount) || 0) + bought.amount;
          sell.amount -= bought.amount;
          bought.meta.amount = bought.amount * -1;
          bought.amount = 0;
        }
      }
      function find_buy(buy: lv.transctn, sell: lv.transctn) {
        return (
          buy.amount > 0 && buy.date < sell.date && buy.broker === sell.broker
        );
      }
      function sum_sales(sell: lv.transctn[]) {
        return sell.reduce((amount, sell) => {
          amount += sell.amount;
          return amount;
        }, 0);
      }
    },
    convert_fx: (
      positn: lv.positn,
      buy: lv.transctn[],
      sell: lv.transctn[],
      dividend: lv.transctn[],
      unbooked: lv.transctn[],
    ) => {
      const { base } = positn;
      const { market_fx, fractional } = base;
      const { money } = util;

      buy.map((b) => {
        const { base, amount } = b;
        b.currency = this.root_currency;
        b.market_value = amount * base.market_price;
        b.traded_value = amount * base.traded_price;
        b.pl_ur = amount * (base.market_price - base.traded_price);
        (["market_value", "pl_ur"] as const).forEach((key) => {
          b[key] = money.to_cents(b[key], fractional);
          b[key] = money.convert_market(b[key], market_fx, fractional);
        });
        b.traded_value = money.to_cents(b.traded_value, fractional);
        b.traded_value = money.convert_traded(b.traded_value, base.traded_fx);
        b.pl_fx = b.market_value - b.traded_value - b.pl_ur;
      });
      sell.map((s) => {
        const { base } = s;
        s.currency = this.root_currency;
        s.pl_r = money.to_cents(s.pl_r, fractional);
        s.pl_r = money.convert_traded(s.pl_r, base.traded_fx);
      });
      dividend.map((d) => {
        const { base } = d;
        d.currency = this.root_currency;
        d.amount = 0;
        d.div_value = money.to_cents(base.traded_price, fractional);
        d.div_value = money.convert_traded(d.div_value, base.traded_fx);
      });
      unbooked.map((u) => {
        u.currency = this.root_currency;
        u.amount = 0;
        u.currency = this.root_currency;
      });
      positn.transctns = [...buy, ...sell, ...dividend, ...unbooked];
      return positn;
    },
    categorise: (transctns: lv.transctn[]) => {
      const cats: p.transctn_cats = {
        buy: [],
        sell: [],
        dividend: [],
        unbooked: [],
      };
      return transctns.reduce((cats, transctn) => {
        const { kind } = transctn;
        cats[kind].push(transctn);
        return cats;
      }, cats);
    },
    set_current_a_ids: (positn: lv.positn) => {
      const { transctn } = this;
      positn.transctns = group_brokers().map(map_groups).flat();
      return positn;

      function map_groups({ buy, sell, dividend, unbooked }: p.transctn_cats) {
        const transctns = [...buy, ...sell, ...dividend, ...unbooked];
        const a_id = find_a_id(buy, sell, positn);
        if (!a_id) return transctns;
        transctns.forEach((t) => {
          t.a_id = a_id;
        });
        return transctns;
      }
      function find_a_id(
        buy: lv.transctn[],
        sell: lv.transctn[],
        positn: lv.positn,
      ) {
        buy = buy.sort((a, b) => b.date - a.date);
        sell = sell.sort((a, b) => b.date - a.date);

        const sell_a_id = sell[0]?.a_id;
        const buy_a_id = buy[0]?.a_id;
        if (!buy_a_id && !!sell_a_id)
          console.error("No position data", { buy, sell, positn });

        return sell_a_id || buy_a_id;
      }
      function group_brokers() {
        const brokers = {} as { [broker in g.broker]: lv.transctn[] };
        positn.transctns.reduce((brokers, t) => {
          if (!brokers[t.broker]) brokers[t.broker] = [];
          brokers[t.broker].push(t);
          return brokers;
        }, brokers);
        return Object.values(brokers).map((b) => transctn.categorise(b));
      }
    },
  };
}

declare global {
  /** Live position types */
  namespace pos {
    type live = {
      p_id: id.p;
      exchange: string;
      currency: string;
      current_session: tv.fields.session | "no longer traded";
      div_yield: number;
      transctns: pos.transctn[];
      base: {
        fractional: boolean;
        currency: string;
        market_price: number;
        market_open: number;
        market_high: number;
        market_low: number;
        market_fx: number;
      };
    };

    type transctn = Omit<g.transctn_v, "traded_price" | "traded_fx"> & {
      market_value: number;
      traded_value: number;
      div_value: number;
      pl_r: number;
      pl_ur: number;
      pl_fx: number;
      state: p.transctn_state;
      meta: p.transctn_meta;
      base: p.base_transctn;
    };
  }
}
namespace p {
  export type transctn_meta = {
    [key in transctn_meta_keys]?: number | string | boolean;
  };
  export type transctn_state =
    | "open"
    | "closed"
    | "sold"
    | "unbooked"
    | "prev_year"
    | "curr_year";

  export type currencies = string[];
  export type pid_map<T> = { [p_id: id.p]: T };
  export type forex_map = { [currency: string]: lv.forex };
  export type transctn_cats = { [key in lv.transctn["kind"]]: lv.transctn[] };
  export type base_transctn = {
    a_id: string;
    currency: string;
    traded_price: number;
    market_price: number;
    traded_fx: number;
    market_fx: number;
    amount: number;
  };

  type transctn_meta_keys = Exclude<
    keyof lv.transctn,
    "meta" | "id" | `${string}_id` | "broker" | "state"
  >;
}
