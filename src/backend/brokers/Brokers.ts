import { Global } from "backend";
import { Cache_Brokers, Instruments } from "@backend/brokers/common";

const brokers = ["saxo", "ibkr"] as const;

export class Brokers extends Global {
  public await_auth = async () => {
    await Promise.all([this.ibkr.await_auth(), this.saxo.await_auth()]);
    await this.request_cache();
  };

  public await_cache = async () => {
    const { accounts, transctns, instrmnts, positions } = this.resolve;
    this.resolve.accounts = accounts ? accounts : this.update.accounts();
    this.resolve.positions = positions ? positions : this.update.positions();
    this.resolve.instrmnts = instrmnts ? instrmnts : this.update.instruments();
    this.resolve.transctns = transctns ? transctns : this.update.transactions();
    return Promise.all([
      this.resolve.accounts,
      this.resolve.positions,
      this.resolve.transctns,
      this.resolve.instrmnts,
    ]);
  };
  public request_cache = async () => {
    try {
      const instruments = await this.cache.instruments;
      this.ws.publish("instruments", instruments);
    } catch (_err) {}
    try {
      const transactions = await this.cache.transactions;
      this.ws.publish("transactions", transactions);
    } catch (_err) {}
    try {
      const live = await this.instruments.live_data();
      this.ws.publish("live_data", live);
    } catch (_err) {}
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
    update: (
      data: chart_data_t[],
      id: string,
      broker: broker_t,
      ...p: p.chart_period
    ) => {
      let [conid, period, granularity] = p;
      const end_last = data[data.length - 1]!.time;
      const end_now = util.time.ms_period_end(util.time.ms_now(), granularity);
      const update_period = util.time.sec(end_now) - end_last;
      if (update_period > 0) {
        period = [update_period, "s"];
        return this[broker]
          .chart_data(conid, period, granularity)
          .then(async (data) => {
            if (data.length) await this.db.insert.chart(id, data);
            return this.db.select.chart(id)!;
          });
      }
      return data;
    },
  };

  private update = {
    accounts: () => {
      return Promise.all(
        brokers.map((broker) => this[broker].update.accounts()),
      );
    },
    positions: async () => {
      await this.resolve.accounts;
      return Promise.all(
        brokers.map((broker) => this[broker].update.positions()),
      );
    },
    instruments: async () => {
      await this.resolve.positions;
      return this.instruments.update();
    },
    transactions: async () => {
      await this.resolve.positions;
      return Promise.all(
        brokers.map((broker) => this[broker].update.transactions()),
      );
    },
  };

  private resolve = {
    accounts: null as resolve_t,
    positions: null as resolve_t,
    instrmnts: null as resolve_t,
    transctns: null as resolve_t,
  };

  public cache = new Cache_Brokers();
  public instruments = new Instruments();
}

declare global {
  type broker_t = (typeof brokers)[number];
}
