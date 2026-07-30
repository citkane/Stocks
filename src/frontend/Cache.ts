export default class Cache {
  public set = {
    accnts: (accnts: g.account[]) => {
      accnts.forEach((accnt) => {
        const [broker, id] = accnt.a_id.split("_") as [g.broker, string];
        this.mem.accnts[broker] ??= {};
        this.mem.accnts[broker][id] = accnt;
      });
    },
    instrmnts: (metas: g.meta_view[]) => {
      metas.forEach((m) => (this.mem.instrmnts[m.p_id] = m));
    },
    geo_map: (geo_map: g.geo_map) => {
      this.mem.geo = geo_map;
    },
    positions: (positns: lv.positn[]) => {
      positns.forEach((p) => {
        this.mem.positns[p.p_id] = p;
        this.set.transctns(p.transctns);
      });
    },
    balances: (balances: lv.balance[]) => {
      const { mem } = this;
      balances.forEach((balance) => {
        const { b_id } = balance;
        const [broker, acc_id, currency] = b_id.split("_") as [
          g.broker,
          string,
          string,
        ];
        mem.balances[broker] ??= {};
        mem.balances[broker][acc_id] ??= {};
        mem.balances[broker][acc_id][currency] = balance;
      });
    },
    transctns: (transctns: lv.transctn[]) => {
      transctns.forEach((t) => (this.mem.transctns[t.id] = t));
    },
  };
  public get = {
    accnts: () => this.mem.accnts,
    instrmnts: () => this.mem.instrmnts,
    positns: () => this.mem.positns,
    transctns: () => this.mem.transctns,
    balances: () => this.mem.balances,
    geo: (qid: string) => this.mem.geo[qid]!,
    place: (place_qid?: string) => {
      return place_qid ? this.mem.geo[place_qid]?.name : undefined;
    },
    country: (country_qid?: string) => {
      return country_qid ? this.mem.geo[country_qid]?.name : undefined;
    },
    region: (region_qid?: string) => {
      return region_qid ? this.mem.geo[region_qid]?.name : undefined;
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
    accnts: {} as { [broker in g.broker]: { [id: string]: g.account } },
    balances: {} as {
      [broker in g.broker]: {
        [id: string]: { [currency: string]: lv.balance };
      };
    },
    instrmnts: {} as { [p_id: string]: g.meta_view },
    positns: {} as { [p_id: string]: lv.positn },
    transctns: {} as { [id: string]: lv.transctn },
    geo: {} as g.geo_map,
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
