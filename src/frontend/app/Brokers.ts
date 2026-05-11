import { Global } from "@frontend/Global";

export class Brokers extends Global {
  static account_headers = ["broker", "alias", "currency", "id"];
  static instrmnt_headers = ["description", "ticker", "positions"];
  static positions_headers = [
    "date",
    "position",
    "buy",
    "market",
    "pl",
    "fx pl",
    "broker",
    "exchange",
  ];

  await_login = () => {
    return Promise.all([
      this.saxo
        .await_login()
        .then(() => this.bootstrap_mess("Saxo authorised")),
      this.ibkr
        .await_login()
        .then(() => this.bootstrap_mess("IBKR authorised")),
    ]);
  };

  cache_init = () => {
    this.messenger.send("push_cache");
  };
  //Promise.all([
  //  this.request<account_t[]>("accounts"),
  //  this.request<transctn_t[]>("transactions"),
  //  this.request<instrmnt_t[]>("instruments"),
  //]);

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
