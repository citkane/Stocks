import { Global, Instruments } from "backend";
import { CacheBrokers } from "@backend/brokers";

const brokers = ["saxo", "ibkr"] as const;
const live_data_freq = util.time.period.to_ms([5, "min"]);

export class Brokers extends Global {
  constructor() {
    super();
    this.add_shutdown_fncs(this.stop_polling);
  }
  public await_auth = async () => {
    await Promise.all([this.ibkr.await_auth(), this.saxo.await_auth()]);
  };

  public push_live_data = async () => {
    try {
      this.ws.publish("live_data", this.cache.live_data);
    } catch (_err) {
      await this.init_cache();
      this.ws.publish("live_data", this.cache.live_data);
    }
  };

  public push_cache = async () => {
    await this.init_cache();
    const accounts = await this.cache.accounts;
    const instruments = await this.cache.instruments;
    const transactions = await this.cache.transactions;
    const live_data = this.cache.live_data;
    const cache_data: cache_t = {
      accounts,
      instruments,
      transactions,
      live_data,
    };
    this.ws.publish("cache", cache_data);
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
    const { accounts, transctns, instrmnts, positions, live_data } =
      this.resolve;
    this.resolve.accounts = accounts ? accounts : this.update.accounts();
    this.resolve.positions = positions ? positions : this.update.positions();
    this.resolve.instrmnts = instrmnts ? instrmnts : this.update.instruments();
    this.resolve.transctns = transctns ? transctns : this.update.transactions();
    this.resolve.live_data = live_data ? live_data : this.update.live_data();

    await Promise.all([
      this.resolve.accounts,
      this.resolve.positions,
      this.resolve.transctns,
      this.resolve.instrmnts,
      this.resolve.live_data,
    ]);
  };
  private update = {
    accounts: async () => {
      this.bootstrap("Updating accounts");
      return Promise.all(
        brokers.map((broker) => this[broker].update.accounts()),
      );
    },
    positions: async () => {
      await this.resolve.accounts;
      this.bootstrap("Updating positions");
      return Promise.all(
        brokers.map((broker) => this[broker].update.positions()),
      );
    },
    live_data: async () => {
      await this.resolve.positions;
      this.bootstrap("Updating live data");
      return await Promise.all([
        this.instruments.live_data(),
        this.ibkr.update.fx().catch(this.ibkr.what_err),
        ...brokers.map((broker) =>
          this[broker].update.account_balances().catch(this[broker].what_err),
        ),
      ]);
    },
    instruments: async () => {
      await this.resolve.positions;
      this.bootstrap("Updating instruments");
      await this.instruments.update();
      this.start_live_polling();
    },
    transactions: async () => {
      await this.resolve.positions;
      this.bootstrap("Updating transactions");
      return Promise.all(
        brokers.map((broker) => this[broker].update.transactions()),
      );
    },
  };

  public cache = new CacheBrokers();
  public instruments = new Instruments();
  private stop_polling = () => {
    if (this.poll_live_data) clearInterval(this.poll_live_data);
  };
  private start_live_polling = () => {
    this.stop_polling();
    this.poll_live_data = setInterval(async () => {
      await this.update.live_data();
      this.ws.publish("live_data", this.brokers.cache.live_data);
    }, live_data_freq);
  };
  private resolver = () => ({
    accounts: null as resolve_t,
    positions: null as resolve_t,
    instrmnts: null as resolve_t,
    transctns: null as resolve_t,
    live_data: null as resolve_t,
  });
  private resolve = this.resolver();
  private poll_live_data?: interval_t;
}

declare global {
  type broker_t = (typeof brokers)[number];
}
