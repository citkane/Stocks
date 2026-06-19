import { Global } from "backend";

export class PositionsSaxo extends Global {
  public update = async () => {
    const { fetch, format, db, db_insert } = this;
    const { open_positns, all_trades, currency_dets } = fetch;
    const { instrmnt_lookup, location_lookup } = fetch;
    const { pstns_to_instrs, trades_to_instrs, map_instrs } = format;
    const { needs_currency_ids, merge_currency_dets } = format;
    const { instruments } = db.select;

    return Promise.all([instruments("saxo"), open_positns(), all_trades()])
      .then(map_instrs)
      .then(pstns_to_instrs)
      .then(trades_to_instrs)
      .then(needs_currency_ids)
      .then(currency_dets)
      .then(merge_currency_dets)
      .then(instrmnt_lookup);
    //.then(db_insert)
    //.then(location_lookup);
  };

  public location_lookup = (instrmnts: Partial<instrmnt_t>[]) =>
    this.fetch.location_lookup(instrmnts);

  private format = {
    map_instrs: async ([
      instrmnts,
      positns,
      trades,
    ]: ret.fetch_payload): Promise<ret.map_instrmnts> => {
      const ex_instrmt_map = await instrmnts.reduce(
        (instrmnt_map, instrmnt) => {
          const { saxo_id } = instrmnt;
          if (!saxo_id) return instrmnt_map;
          instrmnt_map[saxo_id] = instrmnt;
          return instrmnt_map;
        },
        {} as instrmnt_map_t,
      );
      return [positns.flat(), trades.flat(), ex_instrmt_map];
    },
    pstns_to_instrs: async ([
      positns,
      trades,
      ex_instrmnt_map,
    ]: ret.map_instrmnts): Promise<ret.positns_to_instrmnts> => {
      const { pstn_to_instr: position_to_instrmnt } = this.format;
      const new_instrmnt_map = positns.reduce((instrmnt_map, positn) => {
        const instrmnt = position_to_instrmnt(positn);
        const { saxo_id } = instrmnt;
        const exists = !!ex_instrmnt_map[saxo_id!];
        if (exists) return instrmnt_map;

        instrmnt_map[saxo_id!] = instrmnt;
        return instrmnt_map;
      }, {} as instrmnt_map_t);
      return [trades, new_instrmnt_map, ex_instrmnt_map];
    },
    trades_to_instrs: ([
      trades,
      new_instrmnt_map,
      ex_instrmnt_map,
    ]: ret.positns_to_instrmnts) => {
      const { trade_to_instrmnt } = this.format;
      new_instrmnt_map = trades.reduce((instrmnt_map, trade) => {
        const instrmnt = trade_to_instrmnt(trade);
        const { saxo_id } = instrmnt;
        const exists = !!ex_instrmnt_map[saxo_id!] || !!instrmnt_map[saxo_id!];
        if (exists) return instrmnt_map;

        instrmnt_map[saxo_id!] = instrmnt;
        return instrmnt_map;
      }, new_instrmnt_map);
      return new_instrmnt_map;
    },
    needs_currency_ids: (instrmnts_map: instrmnt_map_t): ret.needs_currency => {
      const saxo_ids = Object.values(instrmnts_map)
        .filter((i) => !i.currency)
        .map((i) => i.saxo_id!);
      return [saxo_ids, instrmnts_map];
    },
    pstn_to_instr: (positn: b.s.positn_t): Partial<instrmnt_t> => {
      const { DisplayAndFormat, PositionBase } = positn;
      const { Uic: saxo_id, AssetType: asset_class } = PositionBase;
      const {
        Currency: currency,
        Description: description,
        Symbol,
      } = DisplayAndFormat;
      const [ticker, exchange] = Symbol.split(":") as [string, string];
      return {
        saxo_id,
        asset_class,
        description,
        ticker,
        exchange,
        currency,
      };
    },
    trade_to_instrmnt: (trade: b.s.trade_t): Partial<instrmnt_t> => {
      const {
        Uic: saxo_id,
        AssetType: asset_class,
        InstrumentDescription: description,
        InstrumentSymbol,
      } = trade;
      const [ticker, exchange] = InstrumentSymbol.split(":") as [
        string,
        string,
      ];
      return {
        saxo_id,
        asset_class,
        description,
        ticker,
        exchange,
      };
    },
    merge_currency_dets: ([
      currency_dets,
      instrmnts_map,
    ]: ret.currency_dets) => {
      const det_map = currency_dets.flat().reduce(
        (det_map, det) => {
          const { Identifier: id } = det;
          det_map[id] = det;
          return det_map;
        },
        {} as { [id: number]: b.s.positn_det_t },
      );
      Object.values(instrmnts_map).forEach((instrmnt) => {
        if (instrmnt.currency) return;
        const { saxo_id: id } = instrmnt;
        if (!det_map[id!]) return (instrmnt.currency = "XXX");
        instrmnt.currency = det_map[id!]?.CurrencyCode;
      });
      return Object.values(instrmnts_map);
    },
  };
  private fetch = {
    response_cb: (res: Response) => {
      return res.json().then((data) => data.Data);
    },
    open_positns: () => {
      const { response_cb } = this.fetch;
      const { get, fetch, pager_cb } = this.saxo.api;
      const req = get.open_positns(0);
      return fetch<b.s.positn_t[], "req">(req, { response_cb }, pager_cb);
    },

    all_trades: () => {
      const { response_cb } = this.fetch;
      const { get, fetch, pager_cb } = this.saxo.api;
      const req = get.trades(0);
      return fetch<b.s.trade_t[], "req">(req, { response_cb }, pager_cb);
    },
    currency_dets: async ([
      ids,
      instrmnt_map,
    ]: ret.needs_currency): Promise<ret.currency_dets> => {
      const { response_cb } = this.fetch;
      const opts = { response_cb };
      const { get, fetch, pager_cb } = this.saxo.api;
      const req = get.positn_details(0, ids);
      const prms = [req, opts, pager_cb] as const;
      const details = await fetch<b.s.positn_det_t[], "req">(...prms);
      return [details.flat(), instrmnt_map];
    },
    instrmnt_lookup: (instrmnts: Partial<instrmnt_t>[]) => {
      const { instrmnt_lookup } = this.tv;
      return Promise.all(
        instrmnts.map((instrmnt) => {
          if (instrmnt.i_id) return instrmnt;
          return instrmnt_lookup(instrmnt);
        }),
      );
    },
    location_lookup: (instrmnts: Partial<instrmnt_t>[]) => {
      const { location_lookup } = this.wd;
      return Promise.all(
        instrmnts.map((instrmnt) => {
          return location_lookup(instrmnt as instrmnt_t);
        }),
      );
    },
  };
  private db_insert = async (instrmnts: Partial<instrmnt_t>[]) => {
    await this.db.insert.instruments(instrmnts);
    return instrmnts;
  };
}

type instrmnt_map_t = { [saxo_id: number]: Partial<instrmnt_t> };

/** chained promise returns */
namespace ret {
  export type fetch_payload = [instrmnt_t[], b.s.positn_t[][], b.s.trade_t[][]];
  export type map_instrmnts = [b.s.positn_t[], b.s.trade_t[], instrmnt_map_t];
  export type positns_to_instrmnts = [
    b.s.trade_t[],
    instrmnt_map_t,
    instrmnt_map_t,
  ];
  export type needs_currency = [number[], instrmnt_map_t];
  export type currency_dets = [b.s.positn_det_t[], instrmnt_map_t];
}

// positns_with_currency: (instrmnts: Partial<instrmnt_t>[]) => {
//   const class_map = instrmnts.reduce(
//     (class_map, instrmnt) => {
//       const { asset_class } = instrmnt;
//       if (!class_map[asset_class!]) class_map[asset_class!] = [];
//       class_map[asset_class!]!.push(instrmnt);
//       return class_map;
//     },
//     {} as { [type: string]: Partial<instrmnt_t>[] },
//   );
//   return Promise.all(
//     Object.entries(class_map).map(([asset_class, instrmnts]) => {
//       const uids = instrmnts.map((instrmnt) => instrmnt.saxo_id!);
//     }),
//   );
// },
//private tv_instrmnts = (instrmnts: Partial<instrmnt_t>[]) => {
//  return Promise.all(
//    instrmnts.map((instr) => {
//      this.tv.find_instrmnt();
//    }),
//  );
//};
//const open_instrmnts = this.positns_to_insrmnts_map(open_positns.flat());
////logger.json("SAXO positions raw", open_positns);
//const trades = (await this.positions.fetch_trades()).flat();
//logger.json("SAXO trades", trades);
//const instrmnts = this.trades_to_instrmnts(trades, open_instrmnts);
//logger.json("SAXO part instruments", instrmnts);

// const closed_positns = this.format.trades_to_positions(
//   trades,
//   open_positns,
// );
//logger.json("SAXO trades", closed_uics);
//const _closed_instruments =
//  await this.positions.fetch_instruments(closed_uics);
//const closed_positions =
//  this.format.to_saxo_positions(_closed_instruments);
// logger.json("SAXO closed positions", closed_positns);
//_closed_positns.forEach((p) => {
//  const symbol = encodeURIComponent(p.InstrumentSymbol);
//  this.positions
//    .fetch_closed_uic(symbol)
//    .then((data) => logger.info(data));
//});
//const closed_positns = this.format.to_saxo_positions(_closed_positns);
//logger.json("SAXO closed positions", closed_positns);
//const closed_i_ids = await this.positions.closed_p_ids(open_positns);
//const closed_positns = await this.positions
//  //  .fetch_closed()
//  //  .then((data) => logger.info(data));
//  .fetch_closed(closed_i_ids)
//  .then((closed) => logger.json("SAXO closed positions", closed))
//  .then(this.positions.map_to_positions);
//const positns = [...open_positns, ...closed_positns];
//return this.format.to_positns(positns);

/*
    fetch_closed: (
      skip = 0,
      data_array: b.s.positn_closed_t[] = [],
    ): Promise<b.s.positn_closed_t[]> => {
      const { get, fetch } = this.saxo.api;
      const req = get.closed_positions(skip);
      return fetch<b.s.data_t<b.s.positn_closed_t>>(req).then((data) => {
        const count = !!data.Data ? data.Data.length : 0;
        data_array = [...data_array, ...(data.Data || [])];

        if (!data.__next) return data_array;
        return this.positions.fetch_closed(skip + count, data_array);
      });
    },
*/

/*
  private format = {
    to_positns: (positions: b.s.positn_t[]) => {
      const pos_array = positions.map((p) => this.format.to_positn(p));
      return pos_array.reduce(
        (c, pos) => {
          const { i_id } = pos;
          c[i_id] = pos;
          return c;
        },
        {} as { [i_id: i_id_t]: b.positn_t },
      );
    },
    to_positn: (position: b.s.positn_t): b.positn_t => {
      const { DisplayAndFormat, PositionBase } = position;
      const { Uic: saxo_id } = PositionBase;
      let {
        Symbol,
        Description: description,
        Currency: currency,
      } = DisplayAndFormat;
      currency = currency === "ZAR" ? "ZAC" : currency;

      let [ticker, exchange] = Symbol.split(":") as [string, string];
      exchange = this.saxo.tv_exchange(exchange.toUpperCase());
      if (exchange === "HKEX") ticker = util.string.unpad_hk_ticker(ticker);
      description = util.string.title_case(description);
      const i_id: i_id_t = `${exchange}-${ticker}`;

      return {
        saxo_id,
        i_id,
        currency,
        description,
      };
    },
    to_saxo_position: (trade: b.s.trade_t) => {
      let {
        InstrumentSymbol: Symbol,
        InstrumentDescription: Description,
        Uic,
      } = trade;
      return {
        PositionBase: { Uic },
        PositionView: { CurrentPrice: 0 },
        DisplayAndFormat: {
          Symbol,
          Description,
          Currency: "XXX" as string,
        },
      } as b.s.positn_t;
    },
    trades_to_positions: (trades: b.s.trade_t[], positions: b.s.positn_t[]) => {
      const uics = [...positions.map((p) => p.PositionBase.Uic)];
      trades = trades.filter((t) => {
        if (uics.includes(t.Uic)) return false;
        uics.push(t.Uic);
        return true;
      });
      return trades.map(this.format.to_saxo_position);
    },
  };
  */
