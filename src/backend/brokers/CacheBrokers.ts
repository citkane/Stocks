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
    metas: async () => {
      return (this.mem.metas ??= this.mem.metas =
        await this.db.select.meta_view());
    },
    qid_map: async () => {
      return (this.mem.qid_map ??= this.mem.qid_map =
        await this.db.select.geo.qid_map());
    },
  };

  public set = {
    lv_forex: async (lv_forex: Promise<lv.forex[]>) => {
      return lv_forex.then((f) => (this.mem.lv_forex = f));
    },
    lv_instrmnts: async (lv_instrmnts: Promise<lv.instrmnt[]>) => {
      return lv_instrmnts.then((i) => (this.mem.lv_instrmnts = i));
    },
    metas: async (metas: Promise<g.meta_view[]>) => {
      return metas.then((m) => (this.mem.metas = m));
    },
  };

  public get lv_positns() {
    return this.mem.lv_positns;
  }
  public set lv_positns(positns: lv.positn[]) {
    this.mem.lv_positns = positns;
  }

  public invalidate = {
    lv_forex: () => (this.mem.lv_forex = undefined),
    lv_instrmnt: () => (this.mem.lv_instrmnts = undefined),
    metas: () => (this.mem.metas = undefined),
    qid_map: () => (this.mem.qid_map = undefined),
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
    metas?: g.meta_view[];
    qid_map?: g.qid_map;
  };
}
