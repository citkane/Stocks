import { Global } from "backend";
import { Positions, CacheBrokers } from "@backend/brokers";

const poll_postn_freq = util.time.period.to_ms([5, "s"]);
const poll_balance_freq = util.time.period.to_ms([30, "s"]);

export class Brokers extends Global {
  constructor() {
    super();
    const { live } = this;
    this.add_shutdown_fncs(
      live.stop_postn_poll,
      live.stop_balances_poll,
      live.insert_data,
    );
    this.cache = new CacheBrokers();
    this.positions = new Positions();
  }
  public init = () => this.live.poll_positns().then(this.live.insert_data);
  public await_auth = async () => {
    const promises = conf.brokers.map((broker) => this[broker].await_auth());
    await Promise.all(promises);
  };
  public logout = () => {
    return Promise.all(conf.brokers.map((broker) => this[broker].logout()));
  };
  public update_brokers = async () => {
    const { update, live } = this;
    Brokers.resolved ??= update
      .accounts()
      .then(update.instruments)
      .then(update.meta)
      .then(update.transactions)
      .then(update.lv_positns)
      .then(update.lv_balances)
      .then(live.insert_data)
      .then(() => {
        live.poll_positns();
        live.poll_balances();
      });

    await Brokers.resolved;
    // return live.poll_balances();
  };
  public resp = {
    positns: () => this.cache.lv_positns,
    balances: () => this.cache.get.lv_balances(),
    meta_views: () => this.cache.get.meta_views(),
    geo_map: () => this.cache.get.qid_map(),
    accnts: () => this.cache.get.accnts(),
  };
  public chart = {
    data: async (broker: g.broker, ...p: pr.chart_period) => {
      const { db, chart } = this;
      const [conid, _period, granularity] = p;
      const [c, t] = granularity;
      const id = `${broker}_${conid}_${c}${t}`;
      const data = await db.select.live.chart(id);
      // return data;
      return data.length
        ? chart.update(data, id, broker, ...p)
        : this[broker]
            .chart_data(...p)
            .then((data) => db.insert.live.chart(id, data))
            .then(() => db.select.live.chart(id));
    },
    update: async (
      data: lv.chart_data[],
      id: string,
      broker: g.broker,
      ...p: pr.chart_period
    ) => {
      const { db } = this;
      let [conid, period, granularity] = p;
      const end_last = data[data.length - 1]!.time;
      const end_now = util.time.period.ms_end(util.time.ms_now(), granularity);
      const update_period = util.time.sec(end_now) - end_last;
      if (update_period <= 0) return data;

      period = [update_period, "s"];
      return this[broker]
        .chart_data(conid, period, granularity)
        .then((data) => db.insert.live.chart(id, data))
        .then(() => db.select.live.chart(id));
      //.then(async (data) => {
      //  if (data.length) await this.db.insert.chart(id, data);
      //  return this.db.select.chart(id)!;
      //});
    },
  };
  private update = {
    accounts: () => {
      this.bootstrap("Updating accounts");
      this.cache.invalidate.accnts();
      return Promise.all(
        conf.brokers.map((broker) => this[broker].update_accounts()),
      );
    },
    instruments: () => {
      this.bootstrap("Updating instruments");
      return Promise.all(
        conf.brokers.map((broker) => this[broker].update_instruments()),
      );
    },
    transactions: async () => {
      this.bootstrap("Updating transactions");
      return Promise.all(
        conf.brokers.map((broker) => this[broker].update_transactions()),
      );
    },
    meta: async () => {
      const { db, tv, update, bootstrap } = this;
      let [instrmnts, ex_ids] = await Promise.all([
        db.select.instrmnts(),
        db.select.id_join(["i_id"]).then((i) => i.map((i) => i.i_id)),
      ]);
      instrmnts = instrmnts.filter((i) => !ex_ids.includes(i.i_id));
      if (instrmnts.length)
        bootstrap(`Updating ${instrmnts.length} new instruments`);

      return Promise.all(
        instrmnts.map((i) => tv.instrmnt_lookup(i).then(this.update.geo)),
      ).then(update.store_meta);
    },
    geo: async ([meta, instrmnt]: readonly [g.meta, g.instrmnt]) => {
      const { wd } = this;
      const geo: wd.result = await wd.location_lookup(meta);
      return [geo, meta, instrmnt] as const;
    },
    store_meta: async (
      geo_meta_instrmnt: (readonly [wd.result, g.meta, g.instrmnt])[],
    ) => {
      const { db, cache } = this;

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
      cache.invalidate.metas();
      cache.invalidate.qid_map();
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
    lv_fx: async (metas: g.meta[]) => {
      const { db, positions } = this;
      const transctns = await db.select.transctns.data();
      let currencies = [metas, transctns].flat().map((i) => i.currency);
      currencies = Array.from(new Set(currencies));
      return positions.update.lv_forex(currencies);
    },
    lv_positns: async () => {
      const { positions, cache, update } = this;
      cache.invalidate.live();
      const metas = await cache.get.metas();
      const instrmnts = positions.update.lv_instrmnts(metas);
      const lv_instrmnts = await cache.set.lv_instrmnts(instrmnts);
      const live_forex_p = update.lv_fx(metas);
      const lv_forex = await cache.set.lv_forex(live_forex_p);
      return positions.update.lv_positns(metas, lv_forex, lv_instrmnts);
    },
    lv_balances: async () => {
      const { cache } = this;
      if (!this.auth_state) return cache.get.lv_balances();
      const fx = await cache.get.lv_forex();
      const balances = Promise.all(
        conf.brokers.map((broker) => this[broker].balances(fx)),
      ).then((balances) => balances.flat());

      return cache.set.lv_balances(balances);
    },
  };
  private live = {
    poll_positns: async () => {
      const { live } = this;
      live.stop_postn_poll();
      await live.publish_postns();
      Brokers.poll_positn = setInterval(
        async () => await live.publish_postns(),
        poll_postn_freq,
      );
    },
    /* Needs lower frequency to avoid broker rate limits */
    poll_balances: async () => {
      const { live, update } = this;
      live.stop_balances_poll();
      await update.lv_balances();
      Brokers.poll_balances = setInterval(
        async () => await update.lv_balances(),
        poll_balance_freq,
      );
    },
    stop_postn_poll: () => clearInterval(Brokers.poll_positn),
    stop_balances_poll: () => clearInterval(Brokers.poll_balances),
    publish_postns: async () => {
      const { cache, update, ws } = this;
      const [positns, balances] = await Promise.all([
        update.lv_positns(),
        cache.get.lv_balances(),
      ]);
      cache.lv_positns = positns;
      ws.publish("positns", positns);
      ws.publish("balances", balances);
    },
    insert_data: async () => {
      const { db, cache } = this;
      const [fx, instrmnts, balances] = await Promise.all([
        cache.get.lv_forex(),
        cache.get.lv_instrmnts(),
        cache.get.lv_balances(),
      ]);
      await Promise.all([
        db.insert.live.forex(fx),
        db.insert.live.instrmnts(instrmnts),
        db.insert.live.balances(balances),
      ]);
    },
  };

  private get auth_state() {
    return !conf.brokers
      .map((broker) => this[broker].auth_state)
      .includes(false);
  }
  public cache: CacheBrokers;
  private positions: Positions;
  private static poll_positn?: interval_t;
  private static poll_balances?: interval_t;
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
