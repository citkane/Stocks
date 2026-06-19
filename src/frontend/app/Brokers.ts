import { Global } from "@frontend/Global";

export class Brokers extends Global {
  await_login = () => {
    const promises = conf.brokers.map((broker) =>
      this[broker]
        .await_login()
        .then(() => this.bootstrap_mess(`${broker} authorised`)),
    );
    return Promise.all(promises);
  };

  cache_init = () => {
    this.messenger.send("push_cache");
  };

  chart_data = (
    saxo_id: number | undefined,
    ibkr_id: number | undefined,
    period: period_t,
    granularity: period_t,
  ) => {
    const [broker, id] = !!saxo_id ? ["saxo", saxo_id] : ["ibkr", ibkr_id];
    return this.request<chart_data_t[]>("chart_data", broker, [
      id,
      period,
      granularity,
    ]);
  };
}
