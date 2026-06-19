import { Global } from "backend";
import { CacheBrokers } from "@backend/brokers";

const live_data_freq = util.time.period.to_ms([1, "min"]);

export class Brokers extends Global {
  constructor() {
    super();
    this.add_shutdown_fncs(this.stop_live_polling, this.save_live_data);
  }
  public await_auth = async () => {
    const promises = conf.brokers.map((broker) => this[broker].await_auth());
    await Promise.all(promises);
  };

  //public push_live_data = async () => {
  //  try {
  //    this.ws.publish("live_data", this.cache.live_data);
  //  } catch (_err) {
  //    await this.init_cache();
  //    this.ws.publish("live_data", this.cache.live_data);
  //  }
  //};

  public push_cache = async () => {
    await this.init_cache();
    //const [accounts, instruments, transactions, live_data] = await Promise.all([
    //  this.cache.accounts,
    //  this.cache.instruments,
    //  this.cache.transactions,
    //  this.cache.live_data,
    //]);
    //const cache_data: Omit<cache_t, "forex" | "instrument_data" | "balances"> =
    //  {
    //    accounts,
    //    instruments,
    //    transactions,
    //    live_data,
    //  };
    //this.ws.publish("cache", cache_data);
  };

  public chart = {
    data: async (broker: broker_t, ...p: p.chart_period) => {
      const [conid, _period, granularity] = p;
      const [c, t] = granularity;
      const id = `${broker}_${conid}_${c}${t}`;
      const data = await this.db.select.chart(id);

      return !!data
        ? this.chart.update(data, id, broker, ...p)
        : this[broker].chart_data(...p).then(async (data) => {
            await this.db.insert.chart(id, data);
            return this.db.select.chart(id)!;
          });
    },
    update: async (
      data: chart_data_t[],
      id: string,
      broker: broker_t,
      ...p: p.chart_period
    ) => {
      let [conid, period, granularity] = p;
      const end_last = data[data.length - 1]!.time;
      const end_now = util.time.period.ms_end(util.time.ms_now(), granularity);
      const update_period = util.time.sec(end_now) - end_last;
      if (update_period <= 0) return data;

      period = [update_period, "s"];
      data = await this[broker].chart_data(conid, period, granularity);
      if (data.length) await this.db.insert.chart(id, data);
      return this.db.select.chart(id)!;
      //.then(async (data) => {
      //  if (data.length) await this.db.insert.chart(id, data);
      //  return this.db.select.chart(id)!;
      //});
    },
  };
  private init_cache = async () => {
    const { accounts, transctns, instrmnts, live_data } = this.resolve;
    this.resolve.accounts = accounts ? accounts : this.update.accounts();
    this.resolve.instrmnts = instrmnts ? instrmnts : this.update.instruments();
    this.resolve.transctns = transctns ? transctns : this.update.transactions();
    this.resolve.live_data = live_data ? live_data : this.update.live_data();

    await Promise.all([
      this.resolve.accounts,
      this.resolve.transctns,
      this.resolve.instrmnts,
      this.resolve.live_data,
    ]);
    this.start_live_polling();
  };
  private save_live_data = async (
    forex?: cache_t["forex"],
    data?: cache_t["instrument_data"],
    balances?: cache_t["balances"],
  ) => {
    forex = forex ? forex : await this.cache.forex;
    data = data ? data : await this.cache.instrument_data;
    balances = balances ? balances : await this.cache.balances;
    await Promise.all([
      this.db.insert.forex(forex),
      this.db.insert.instrument_data(data),
      this.db.insert.balances(balances),
    ]);
  };
  private update = {
    accounts: async () => {
      this.bootstrap("Updating accounts");
      return Promise.all(
        conf.brokers.map((broker) => this[broker].update.accounts()),
      );
    },
    instruments: async () => {
      await this.resolve.accounts;
      this.bootstrap("Updating instruments");
      return Promise.all(
        conf.brokers.map((broker) => this[broker].update.instruments()),
      );
    },
    live_data: async () => {
      await this.resolve.instrmnts;
      const { tv, cache, save_live_data } = this,
        [forex, data, balances] = await Promise.all([
          cache.currencies.then((c) => tv.forex(conf.base_currency, c)),
          cache.instruments.then((i) => tv.instrument_data(Object.values(i))),
          fetch_balances.bind(this)(),
        ]);
      if (!cache.live_ready()) await save_live_data(forex, data, balances);
      cache.forex = Promise.resolve(forex);
      cache.instrument_data = Promise.resolve(data);

      function fetch_balances(this: Brokers) {
        return Promise.all(
          conf.brokers.map((b) => this[b].acc_balances()),
        ).then(red_bals);
      }
      function red_bals(bs: cache_t["balances"][]) {
        const balances = {} as cache_t["balances"];
        return bs.reduce((bss, bs) => {
          bss = { ...bss, ...bs };
          return bss;
        }, balances);
      }
    },
    transactions: async () => {
      await this.resolve.instrmnts;
      this.bootstrap("Updating transactions");
      return Promise.all(
        conf.brokers.map((broker) => this[broker].update.transactions()),
      );
    },
  };

  public cache = new CacheBrokers();
  private stop_live_polling = () => {
    if (this.poll_live_data) clearInterval(this.poll_live_data);
  };
  private start_live_polling = () => {
    const { cache, stop_live_polling, update, ws } = this;
    stop_live_polling();
    this.poll_live_data = setInterval(async () => {
      const data = await update.live_data().then(() => cache.live_data);
      console.log(data.balances);
      console.log(
        Object.values(data.instrmnts).filter(
          (i) => i.current_session !== "out_of_session",
        ),
      );
      //console.log(Object.keys(data));

      // ws.publish("live_data", data);
    }, live_data_freq);
  };
  private resolver = () => ({
    accounts: null as resolve_t,
    //positions: null as resolve_t,
    instrmnts: null as resolve_t,
    transctns: null as resolve_t,
    live_data: null as resolve_t,
  });
  private resolve = this.resolver();
  private poll_live_data?: interval_t;
}
