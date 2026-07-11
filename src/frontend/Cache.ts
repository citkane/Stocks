export default class Cache {
  public set = {
    instrmnts: (metas: g.meta_view[]) => {
      metas.forEach((m) => (this.mem.instrmnts[m.p_id] = m));
    },
    qid_map: (qid_map: g.qid_map) => {
      this.mem.qid_map = qid_map;
    },
    positions: (positns: lv.positn[]) => {
      positns.forEach((p) => {
        this.mem.positns[p.p_id] = p;
        this.set.transctns(p.transctns);
      });
    },
    transctns: (transctns: lv.transctn[]) => {
      transctns.forEach((t) => (this.mem.transctns[t.id] = t));
    },
  };
  public get = {
    instrmnts: () => this.mem.instrmnts,
    positns: () => this.mem.positns,
    transctns: () => this.mem.transctns,
    place: (place_qid?: string) => {
      return place_qid ? this.mem.qid_map[place_qid]?.name : undefined;
    },
    country: (country_qid?: string) => {
      return country_qid ? this.mem.qid_map[country_qid]?.name : undefined;
    },
    region: (region_qid?: string) => {
      return region_qid ? this.mem.qid_map[region_qid]?.name : undefined;
    },
  };
  public get filter() {
    return Object.fromEntries(
      Object.entries(self.filter).filter(
        ([_key, val]) => !["all", "none", ""].includes(val),
      ),
    ) as Partial<filter.data>;
  }

  private get mem() {
    return Cache.mem;
  }

  private static mem = {
    instrmnts: {} as { [p_id: string]: g.meta_view },
    positns: {} as { [p_id: string]: lv.positn },
    transctns: {} as { [id: string]: lv.transctn },
    qid_map: {} as g.qid_map,
    geo: {} as { [country: string]: { [region: string]: string[] } },
  };
  public static filter: filter.data = {
    broker: "all",
    a_id: "none",
    asset_sector: "all",
    asset_industry: "none",
    country_qid: "all",
    region_qid: "none",
    place_qid: "none",
    //search: "",
  } as const;
}
const self = Cache;

declare global {
  namespace fe {
    type cache = (typeof Cache)["mem"];
  }
}

/*
  //private static set = {
  //  geo_assets: (metas: g.meta_view[]) => {
  //    metas.forEach((m) => this.set.geo(m.geo));
  //  },
  //  geo: (geo_meta: g.meta_view["geo"]) => {
  //    const { place_qid, region_qid, country_qid } = geo_meta;
  //    const { geo, qid_map } = this.mem;
  //
  //    if (!place_qid || !region_qid || !country_qid) return;
  //    const g = {
  //      place: qid_map[place_qid]!.name,
  //      region: qid_map[region_qid]!.name,
  //      country: qid_map[country_qid]!.name,
  //    };
  //    if (!geo[g.country]) geo[g.country] = { [g.region]: [] };
  //    if (!geo[g.country]![g.region]) geo[g.country]![g.region] = [];
  //    const ex_places = geo[g.country]![g.region]!;
  //    geo[g.country]![g.region] = [...new Set([...ex_places, g.place])];
  //  },
  //};
    asset_cats: (sector?: string, industry?: string) => {
      if (!sector || !industry) return;
      const { assets_cats } = this.mem;
      if (!assets_cats[sector]) assets_cats[sector] = [];
      assets_cats[sector] = [...new Set([...assets_cats[sector], industry])];
    },
        brokers: (transctns: lv.transctn[]) => {
      this.mem.brokers = this.mem.brokers.union(
        new Set(transctns.map((t) => t.broker)),
      );
    },

*/

//public get filter() {
//  return Cache._filter;
//}
//public get ready() {
//  const ready =
//    !!this.mem.accounts && !!this.mem.instruments && !!this.mem.transactions;
//  return ready;
//}
//public get a_ids() {
//  return Object.values(this.mem.accounts)
//    .map((accs) => Object.keys(accs))
//    .flat() as id.a[];
//}
//public get account_brokers() {
//  return Object.keys(this.mem.accounts) as g.broker[];
//}
//public get accounts() {
//  return Object.values(this.mem.accounts)
//    .map((b) => Object.values(b))
//    .flat();
//}
//public get instruments() {
//  return this.mem.instruments || {};
//}
//public get transactions() {
//  return Object.entries(this.mem.transactions).reduce(
//    (transctns, entry) => {
//      const [i_id, ts] = entry;
//      transctns[i_id as id.i] = Object.values(ts);
//      return transctns;
//    },
//    {} as fe.cache["transactions"],
//  );
//}
// public get asset_sectors() {
//   if (this.mem.sectors) return this.mem.sectors;
//   this.set.asset_sectors();
//   return this.mem.sectors;
// }
// public get asset_industries() {
//   if (this.mem.industries) return this.mem.industries;
//   this.set.asset_industries();
//   return this.mem.industries;
// }
//
//public get = {
//  accounts: (broker: g.broker) => {
//    return Object.values(this.mem.accounts[broker] || {});
//  },
//  account: (a_id: id.a) => {
//    return Object.values(this.mem.accounts).reduce(
//      (accs, accs_b) => {
//        accs = { ...accs, ...accs_b };
//        return accs;
//      },
//      {} as { [a_id: string]: fe.account },
//    )[a_id]!;
//  },
//  a_ids: (broker: g.broker) => {
//    return Object.keys(this.mem.accounts[broker] || {}) as id.a[];
//  },
//  instrument: (i_id: id.i) => {
//    const err = `Instrument ${i_id} not found`;
//    if (!this.mem.instruments[i_id]) throw Error(err);
//    return this.mem.instruments[i_id];
//  },
//  transactions: (i_id: id.i) => {
//    if (!!this.transactions[i_id]) return this.transactions[i_id];
//    const warn = `Transactions for ${i_id} not found, unbooked`;
//    logger.warn(warn);
//    return [Money.unbooked_transctn(i_id)];
//  },
//};
//private set = {
//  asset_industries: () => {
//    const sectors = this.set.asset_sectors();
//    const industries = Object.entries(sectors).reduce(
//      (indstrs, entry) => {
//        const [sector, i_set] = entry;
//        i_set.forEach((industry) => {
//          indstrs.push([sector, industry]);
//        });
//        return indstrs;
//      },
//      [] as [string, string][],
//    );
//    this.mem.industries = industries.sort((a, b) =>
//      a[1]!.localeCompare(b[1]),
//    );
//  },
//  asset_sectors: () => {
//    const { mem, instruments } = this;
//
//    const sectors = Object.values(instruments).reduce(
//      (sectors, instrmnt) => {
//        const { asset_sector: sector, asset_industry: industry } =
//          instrmnt.meta;
//        if (!sector) return sectors;
//        if (!sectors[sector]) sectors[sector] = new Set();
//        if (industry) sectors[sector].add(industry);
//        return sectors;
//      },
//      {} as { [key: string]: Set<string> },
//    );
//    mem.sectors = Object.keys(sectors).sort((a, b) => a.localeCompare(b));
//    return sectors;
//  },
//fe_transctn: (transctn: fe.transctn, instrmnt: fe.instrmnt) => {
//  transctn.meta = transctn.meta || {};
//  transctn.live = instrmnt.live;
//  transctn.base = Money.base.transctn(transctn);
//  return transctn;
//},
// fe_account: (accnt: fe.account, data?: lv.balance) => {
//   accnt.live = Money.live.account(accnt, data);
//   accnt.base = Money.base.accnt(accnt);
// },

//public set accounts(accounts: fe.cache["accounts"]) {
//  this.mem.accounts = accounts.reduce((accs, acc) => {
//    const { a_id } = acc;
//    const broker = a_id.split("_")[0]!;
//    if (!accs[broker]) accs[broker] = {};
//    accs[broker][a_id] = acc;
//    return accs;
//  }, this.mem.accounts || {});
//}

/*
  public set transactions(transctns: fe.cache["transactions"]) {
    const { fe_transctn } = this.set;
    const { mem, get } = this;
    mem.transactions = Object.entries(transctns).reduce(
      reducer,
      mem.transactions || {},
    );

    function reducer(
      transctns: typeof mem.transactions,
      entry: [string, fe.transctn[]],
    ) {
      const [i_id, ts] = entry;
      const instrmnt = get.instrument(i_id as id.i);
      if (!transctns[i_id]) transctns[i_id] = {};
      ts.forEach((t) => (transctns[i_id]![t.id] = fe_transctn(t, instrmnt)));
      return transctns;
    }
  }
  public set instruments(instruments: fe.cache["instruments"]) {
    this.invalidate("asset_classes", "sectors", "industries");
    Object.values(instruments).forEach(
      (i) => (i.live = Money.live.instrmnt(i)),
    );
    this.mem.instruments = { ...(this.mem.instruments || {}), ...instruments };
  }
  public set live_data(data: fe.cache["live_data"]) {
    const { get, set } = this;
    Object.entries(data.instrmnts).forEach(([i_id, data]) => {
      const instrmnt = get.instrument(i_id as id.i);
      Money.live.instrmnt(instrmnt, data);
      get
        .transactions(i_id as id.i)
        .forEach((t) => set.fe_transctn(t, instrmnt));
    });
    Object.entries(data.balances!).forEach(([a_id, data]) => {
      const account = get.account(a_id as id.a);
      set.fe_account(account, data);
    });
  }
*/
// public set positions(positns: typeof Positions.positns) {
//   let { instruments, transactions } = this.mem;
//   Object.entries(positns).reduce(
//     (mem, [i_id, positn]) => {
//       mem.instruments[i_id] = positn.instrmnt;
//       mem.transactions[i_id] = positn.transctns;
//       return mem;
//     },
//     { instruments, transactions },
//   );
// }
// public static _filter = {} as fe.filter_t;
// public selector?: fe.selector_i;
//
// private mem = {
//   accounts: {},
//   instruments: {},
//   transactions: {},
//   exchgs: [],
//   sectors: [],
//   industries: [],
//   asset_classes: [],
// } as {
//   accounts: { [broker: string]: { [a_id: string]: fe.account } };
//   instruments: { [i_id: string]: fe.instrmnt };
//   transactions: { [i_id: string]: fe.transctn[] };
//   exchgs: string[];
//   sectors: string[];
//   industries: [string, string][];
//   asset_classes: string[];
// };
// private invalidate = (...keys: (keyof typeof this.mem)[]) => {
//   keys.forEach((key) => delete this.mem[key]);
// };

//balances: (a_id: string) => {
//  const err = `Account ${a_id} not found`;
//  if (!this._accounts.has(a_id)) throw Error(err);
//  return this._accounts.get(a_id)!;
//},

//public set fx(fx: fx_rates_t) {
//  this._fx = fx;
//}
//public get exchanges() {
//  if (this._exchgs) return this._exchgs;
//  const exchngs = this._instrmnts.values().map((i) => i.exchange);
//  return (this._exchgs = [...new Set(exchngs).values()]);
//}
//public get fx() {
//  return this._fx!;
//}
