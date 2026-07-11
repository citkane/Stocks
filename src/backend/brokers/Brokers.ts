import { Global } from "backend";
import { Positions, CacheBrokers } from "@backend/brokers";

const update_freq = util.time.period.to_ms([5, "s"]);

export class Brokers extends Global {
  constructor() {
    super();
    this.add_shutdown_fncs(this.stop_polling, this.insert_live_data);

    this.cache = new CacheBrokers();
    this.positions = new Positions();
  }

  public init = () => this.start_polling().then(this.insert_live_data);
  public await_auth = async () => {
    const promises = conf.brokers.map((broker) => this[broker].await_auth());
    await Promise.all(promises);
  };
  public logout = () => {
    return Promise.all(conf.brokers.map((broker) => this[broker].logout()));
  };
  public update_brokers = async () => {
    const { update } = this;
    Brokers.resolved ??= update
      .accounts()
      .then(update.instruments)
      .then(update.meta)
      .then(update.transactions)
      .then(update.lv_positns)
      .then(this.insert_live_data);

    await Brokers.resolved;
    return this.start_polling();
  };

  public resp = {
    lv_positns: () => this.cache.lv_positns,
    metas: () => this.cache.get.metas(),
    qid_map: () => this.cache.get.qid_map(),
  };
  //public push_live_data = async () => {
  //  try {
  //    this.ws.publish("live_data", this.cache.live_data);
  //  } catch (_err) {
  //    await this.init_cache();
  //    this.ws.publish("live_data", this.cache.live_data);
  //  }
  //};

  //public push_cache = async () => {
  //  await this.init_cache();
  //  const [accounts, instruments, transactions, live] = await Promise.all([
  //    this.cache.accounts,
  //    this.cache.instruments,
  //    this.cache.transactions,
  //    this.cache.live,
  //  ]);
  //  const cache_data: fe.cache = {
  //    accounts,
  //    instruments,
  //    transactions,
  //    live,
  //  };
  //  this.ws.publish("cache", cache_data);
  //};
  //
  public chart = {
    data: async (broker: g.broker, ...p: pr.chart_period) => {
      const [conid, _period, granularity] = p;
      const [c, t] = granularity;
      const id = `${broker}_${conid}_${c}${t}`;
      const data = await this.db.select.live.chart(id);

      return !!data
        ? this.chart.update(data, id, broker, ...p)
        : this[broker].chart_data(...p).then(async (data) => {
            await this.db.insert.live.chart(id, data);
            return this.db.select.live.chart(id)!;
          });
    },
    update: async (
      data: lv.chart_data[],
      id: string,
      broker: g.broker,
      ...p: pr.chart_period
    ) => {
      let [conid, period, granularity] = p;
      const end_last = data[data.length - 1]!.time;
      const end_now = util.time.period.ms_end(util.time.ms_now(), granularity);
      const update_period = util.time.sec(end_now) - end_last;
      if (update_period <= 0) return data;

      period = [update_period, "s"];
      data = await this[broker].chart_data(conid, period, granularity);
      if (data.length) await this.db.insert.live.chart(id, data);
      return this.db.select.live.chart(id)!;
      //.then(async (data) => {
      //  if (data.length) await this.db.insert.chart(id, data);
      //  return this.db.select.chart(id)!;
      //});
    },
  };
  private update = {
    accounts: async () => {
      this.bootstrap("Updating accounts");

      return Promise.all(
        conf.brokers.map((broker) => this[broker].update_accounts()),
      );
    },
    instruments: async () => {
      const { db, bootstrap } = this;
      // await Brokers.resolve.accounts;
      this.bootstrap("Updating instruments");

      const instrmnts = await Promise.all(
        conf.brokers.map((broker) => this[broker].update_instruments()),
      ).then((instrmnts) => instrmnts.flat());

      await db.insert.instrumnts(instrmnts);

      if (instrmnts.length)
        bootstrap(`Updating ${instrmnts.length} new instruments`);
      return instrmnts;
    },
    transactions: async () => {
      this.bootstrap("Updating transactions");

      return Promise.all(
        conf.brokers.map((broker) => this[broker].update_transactions()),
      );
    },
    meta: async (instrmnts?: g.instrmnt[]) => {
      if (instrmnts && !instrmnts.length) return;

      const { db, tv, update } = this;
      instrmnts ??= await db.select.instrmnts();

      return Promise.all(
        instrmnts.map((i) => tv.instrmnt_lookup(i).then(this.update.geo)),
      ).then(update.store_meta);
    },
    geo: async ([meta, instrmnt]: readonly [g.meta, g.instrmnt]) => {
      const { wd, bootstrap } = this;
      const geo: wd.result = await wd.location_lookup(meta);

      return [geo, meta, instrmnt] as const;
    },
    store_meta: async (
      geo_meta_instrmnt: (readonly [wd.result, g.meta, g.instrmnt])[],
    ) => {
      const { db } = this;
      const data_to_db = {
        id_joins: [] as db.data<"id_join">[],
        loctns: [] as db.data<"meta_location">[],
        cntrys: [] as db.data<"geo_country">[],
        regns: [] as db.data<"geo_region">[],
        plcs: [] as db.data<"geo_place">[],
        metas: [] as g.meta[],
      };

      const { id_joins, loctns, cntrys, regns, plcs, metas } =
        geo_meta_instrmnt.reduce(
          (data, [{ country, region, place, locatn }, meta, instrmnt]) => {
            const id_join = { i_id: instrmnt.i_id, p_id: meta.p_id };
            data.id_joins.push(id_join);
            data.loctns.push(locatn);
            data.metas.push(meta);
            if (country) data.cntrys.push(country);
            if (region) data.regns.push(region);
            if (place) data.plcs.push(place);
            return data;
          },
          data_to_db,
        );

      await Promise.all([
        db.insert.id_join(id_joins),
        db.insert.meta(metas),
        db.insert.geo.locatn(loctns),
        filter_geo(cntrys).then(merge_search).then(db.insert.geo.country),
        filter_geo(regns).then((r) => db.insert.geo.region(r[0])),
        filter_geo(plcs).then(merge_search).then(db.insert.geo.place),
      ]);
      return;

      async function filter_geo<T>(
        geo: T extends
          | db.data<"geo_country">[]
          | db.data<"geo_region">[]
          | db.data<"geo_place">[]
          ? T
          : never,
      ) {
        const index: { [qid: string]: string[] | true } = {};
        const filtered = geo.filter((g) => {
          const { qid } = g,
            search: string[] | undefined = (g as any).search;

          if (index[qid]) {
            index[qid] = search
              ? [...new Set([...(index[qid]! as string[]), ...search])]
              : true;
            return false;
          }
          index[qid] = search || true;
          return true;
        });
        return [filtered as T, index] as const;
      }
      function merge_search<T>([geo, index]: T extends readonly [
        (
          | db.data<"geo_country">
          | db.data<"geo_place">
          | db.data<"geo_region">
        )[],
        { [qid: string]: string[] | true },
      ]
        ? T
        : never) {
        return geo.map((g) => {
          const search = (g as any).search;
          if (!search) return g;
          (g as any).search = index[g.qid]! as string[];
          return g;
        }) as T extends readonly [infer R, any] ? R : never;
      }
    },
    lv_positns: async () => {
      const { positions, cache } = this;
      const { update } = positions;
      const metas = await this.db.select.meta(); //await cache.get.metas();

      const live_instrmnts_p = update.lv_instrmnts(metas);
      const lv_instrmnts = await cache.set.lv_instrmnts(live_instrmnts_p);

      const live_forex_p = update.lv_forex(metas);
      const lv_forex = await cache.set.lv_forex(live_forex_p);

      return update.lv_positns(metas, lv_forex, lv_instrmnts);
    },
  };

  private start_polling = async () => {
    const { update, cache, ws } = this;
    this.stop_polling();
    cache.lv_positns = await update.lv_positns();
    ws.publish("positns", cache.lv_positns);

    Brokers.interval = setInterval(async () => {
      cache.lv_positns = await update.lv_positns();
      ws.publish("positns", cache.lv_positns);
    }, update_freq);
  };
  private stop_polling = () => {
    if (Brokers.interval) clearInterval(Brokers.interval);
  };
  private insert_live_data = async () => {
    const { db, cache } = this;
    const forex = await cache.get.lv_forex();
    const lv_instrmnts = await cache.get.lv_instrmnts();
    await Promise.all([
      db.insert.live.forex(forex),
      db.insert.live.instrmnts(lv_instrmnts),
    ]);
  };

  public cache: CacheBrokers;
  private positions: Positions;
  private static interval?: interval_t;
  private static resolved = null as resolve_t;
}

// private debug = (positns: lv.positn[]) => {
//   const p = positns
//     .filter((p) => !["out_of_session", "holiday"].includes(p.current_session))
//     .map(prune);
//   console.timeEnd("lv_total");
//
//   function prune(p: lv.positn) {
//     if (p.base_instrmnt) return p.base_instrmnt;
//     return Object.fromEntries(
//       Object.entries(p).filter(
//         ([k]) => !["transctns", "base_instrmnt"].includes(k),
//       ),
//     );
//   }
// };
