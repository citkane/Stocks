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

  await_login = () =>
    Promise.all([
      this.saxo.await_login().then(() => logger.info("Saxo authorised")),
      this.ibkr.await_login().then(() => logger.info("IBKR authorised")),
    ]);

  request_cache = () => this.messenger.send("request_cache");
  //Promise.all([
  //  this.request<account_t[]>("accounts"),
  //  this.request<transctn_t[]>("transactions"),
  //  this.request<instrmnt_t[]>("instruments"),
  //]);

  chart_data = (i_id: i_id_t, period: period_t, granularity: period_t) => {
    const [broker, conid] = i_id.split("_");
    return this.request<chart_data_t[]>("chart_data", broker, [
      conid,
      period,
      granularity,
    ]);
  };
}
