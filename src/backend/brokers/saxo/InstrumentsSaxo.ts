import { Global } from "backend";

export class InstrumentsSaxo extends Global {
  public update = async () => {
    const { get, frmt, db } = this;

    return Promise.all([
      db.select
        .instrmnts(["saxo_id", true], ["saxo_id"])
        .then((i) => i.map((i) => i.saxo_id!)),
      get.open_positns().then((p) => p.flat()),
      get.all_trades().then((t) => t.flat()),
    ])
      .then(frmt.to_new_only)
      .then(frmt.pstns_to_instrs)
      .then(frmt.trades_to_instrs)
      .then(frmt.needs_currency_ids)
      .then(get.currency_dets)
      .then(frmt.merge_currency_dets);
  };

  private frmt = {
    to_new_only: ([ex_ids, positns, trades]: [
      number[],
      b.s.positn_t[],
      b.s.trade_t[],
    ]) => {
      positns = positns.filter((p) => !ex_ids.includes(p.PositionBase.Uic));
      ex_ids = [...ex_ids, ...positns.map((p) => p.PositionBase.Uic)];
      trades = trades.filter((t) => !ex_ids.includes(t.Uic));
      return [positns, trades] as const;
    },
    pstns_to_instrs: ([positns, trades]: readonly [
      b.s.positn_t[],
      b.s.trade_t[],
    ]) => {
      const { frmt } = this;
      const new_instrmnts = {} as p.map<g.instrmnt>;

      positns.reduce((new_instrmnts, positn) => {
        const instrmnt = frmt.pstn_to_instr(positn);
        new_instrmnts[instrmnt.saxo_id!] = instrmnt;
        return new_instrmnts;
      }, new_instrmnts);

      return [trades, new_instrmnts] as const;
    },
    trades_to_instrs: ([trades, new_instrmnts]: readonly [
      b.s.trade_t[],
      p.map<g.instrmnt>,
    ]) => {
      const { frmt } = this;

      return trades.reduce((new_instrmnts, trade) => {
        const instrmnt = frmt.trade_to_instrmnt(trade);
        new_instrmnts[instrmnt.saxo_id!] = instrmnt;
        return new_instrmnts;
      }, new_instrmnts);
    },
    needs_currency_ids: (instrmnts: p.map<g.instrmnt>) => {
      const saxo_ids = Object.values(instrmnts)
        .filter((i) => !i.currency || i.currency === "XXX")
        .map((i) => i.saxo_id!);
      return [instrmnts, saxo_ids] as const;
    },
    pstn_to_instr: (positn: b.s.positn_t): g.instrmnt => {
      const { DisplayAndFormat, PositionBase } = positn;
      const { Uic, AssetType: asset_class } = PositionBase;
      const {
        Currency: currency,
        Description: description,
        Symbol,
      } = DisplayAndFormat;
      const [ticker, exchange] = Symbol.split(":") as [string, string];
      return {
        i_id: `${exchange}-${ticker}`,
        saxo_id: Number(Uic),
        ticker,
        exchange,
        currency,
        asset_class,
        description,
      };
    },
    trade_to_instrmnt: (trade: b.s.trade_t): g.instrmnt => {
      const {
        Uic,
        AssetType: asset_class,
        InstrumentDescription: description,
        InstrumentSymbol,
      } = trade;
      const [ticker, exchange] = InstrumentSymbol.split(":") as [
        string,
        string,
      ];
      return {
        i_id: `${exchange}-${ticker}`,
        saxo_id: Number(Uic),
        ticker,
        exchange,
        currency: "XXX",
        asset_class,
        description,
      };
    },
    merge_currency_dets: ([instrmnts, currency_dets]: readonly [
      p.map<g.instrmnt>,
      b.s.positn_det_t[],
    ]) => {
      const det_map = currency_dets.flat().reduce(
        (det_map, det) => {
          const { Identifier: id } = det;
          det_map[id] = det;
          return det_map;
        },
        {} as { [id: number]: b.s.positn_det_t },
      );
      Object.values(instrmnts).forEach((instrmnt) => {
        if (instrmnt.currency && instrmnt.currency !== "XXX") return;
        const { saxo_id: id } = instrmnt;
        if (!det_map[id!]) return (instrmnt.currency = "XXX");
        instrmnt.currency = det_map[id!]!.CurrencyCode;
      });
      return Object.values(instrmnts);
    },
  };
  private get = {
    open_positns: () => {
      const { response_cb } = this.fetcher;
      const { get, fetch, pager_cb } = this.saxo.api;
      const req = get.open_positns(0);
      return fetch<b.s.positn_t[], "req">(req, { response_cb }, pager_cb);
    },

    all_trades: () => {
      const { response_cb } = this.fetcher;
      const { get, fetch, pager_cb } = this.saxo.api;
      const req = get.trades(0);
      return fetch<b.s.trade_t[], "req">(req, { response_cb }, pager_cb);
    },
    currency_dets: async ([instrmnt_map, ids]: readonly [
      p.map<g.instrmnt>,
      number[],
    ]) => {
      const { response_cb } = this.fetcher;
      const opts = { response_cb };
      const { get, fetch, pager_cb } = this.saxo.api;
      const req = get.positn_details(0, ids);
      const prms = [req, opts, pager_cb] as const;
      const details = await fetch<b.s.positn_det_t[], "req">(...prms);
      return [instrmnt_map, details.flat()] as const;
    },
  };
  private fetcher = {
    response_cb: (res: Response) => {
      return res.json().then((data) => data.Data);
    },
  };
}

namespace p {
  export type map<T> = { [saxo_id: number]: T };
}
