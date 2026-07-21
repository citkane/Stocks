import { Global } from "@backend/Global";

export class CacheBrokers extends Global {
  public get = {
    lv_forex: async () => {
      return (this.mem.lv_forex ??= this.mem.lv_forex =
        await this.db.select.live.forex());
    },
    lv_instrmnts: async () => {
      return (this.mem.lv_instrmnts ??= this.mem.lv_instrmnts =
        await this.db.select.live.instrmnts());
    },
    lv_balances: async () => {
      return (this.mem.lv_balances ??= this.mem.lv_balances =
        await this.db.select.live.balances());
    },
    metas: async () => {
      return (this.mem.metas ??= this.mem.metas = await this.db.select.meta());
    },
    meta_views: async () => {
      return (this.mem.meta_views ??= this.mem.meta_views =
        await this.db.select.meta_view());
    },
    qid_map: async () => {
      return (this.mem.qid_map ??= this.mem.qid_map =
        await this.db.select.geo.qid_map());
    },
    accnts: async () => {
      return (this.mem.accnts ??= this.mem.accnts =
        await this.db.select.accounts());
    },
  };

  public set = {
    lv_forex: async (lv_forex: Promise<lv.forex[]>) => {
      return lv_forex.then((f) => (this.mem.lv_forex = f));
    },
    lv_instrmnts: async (lv_instrmnts: Promise<lv.instrmnt[]>) => {
      return lv_instrmnts.then((i) => (this.mem.lv_instrmnts = i));
    },
    lv_balances: async (lv_balances: Promise<lv.balance[]>) => {
      return lv_balances.then((b) => (this.mem.lv_balances = b));
    },
  };

  public get lv_positns() {
    return this.mem.lv_positns;
  }
  public set lv_positns(positns: lv.positn[]) {
    this.mem.lv_positns = positns;
  }

  public invalidate = {
    live: () => {
      this.mem.lv_forex = undefined;
      this.mem.lv_instrmnts = undefined;
      this.mem.lv_balances = undefined;
    },
    qid_map: () => (this.mem.qid_map = undefined),
    metas: () => {
      this.mem.metas = undefined;
      this.mem.meta_views = undefined;
    },
    accnts: () => (this.mem.accnts = undefined),
  };

  private get mem() {
    return CacheBrokers.mem;
  }
  private static mem = {
    lv_positns: [],
  } as {
    lv_positns: lv.positn[];
    lv_forex?: lv.forex[];
    lv_instrmnts?: lv.instrmnt[];
    lv_balances?: lv.balance[];
    meta_views?: g.meta[];
    metas?: g.meta[];
    qid_map?: g.geo_map;
    accnts?: g.account[];
  };
}
