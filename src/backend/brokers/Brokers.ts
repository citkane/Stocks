import { Global } from "backend";
import { CacheBrokers } from "./CacheBrokers";

declare global {
  type broker_t = (typeof brokers)[number];
}
const brokers = ["saxo", "ibkr"] as const;

export class Brokers extends Global {
  public await_auth = () => {
    return Promise.all([this.ibkr.await_auth(), this.saxo.await_auth()]);
  };

  public await_cache = () => {
    const { accounts, positions } = this.resolve;
    this.resolve.accounts = accounts ? accounts : this.update.accounts();
    this.resolve.positions = positions ? positions : this.update.positions();
    return Promise.all([this.resolve.accounts, this.resolve.positions])
      .then(() => this.cache.transactions)
      .then((transactions) => logger.json("TRANSACTIONS", transactions));
  };

  public chart = {
    data: async (broker: broker_t, ...p: p.chart_data) => {
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
      ...p: p.chart_data
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
  public cache = new CacheBrokers();

  private update = {
    accounts: () =>
      Promise.all(brokers.map((broker) => this[broker].update.accounts())),
    positions: () =>
      this.update
        .fx()
        .then(() =>
          Promise.all(brokers.map((broker) => this[broker].update.positions())),
        ),
    fx: () => this.ibkr.update.fx(),
  };
  private resolve = {
    accounts: null as resolve_t,
    positions: null as resolve_t,
  };
}
