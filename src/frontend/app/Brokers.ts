import { Global } from "@frontend/Global";

export class Brokers extends Global {
  static account_headers = ["broker", "alias", "currency", "id"];
  static stock_headers = ["description", "ticker", "positions"];
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

  saxo_login = () => this.saxo.login_backend();
  wait_for_auth = () =>
    Promise.all([
      this.saxo.await_login().then(() => console.info("Saxo authorised")),
      this.ibkr.await_login().then(() => console.info("IBKR authorised")),
    ]);

  cache_position = (position: position_t) => this.cache.add.position(position);
  cache_account = (account: account_t) => this.cache.add.account(account);
  //wait_for_cache = () => this.messenger.request<"backend">("wait_for_cache");
  request_cache = () =>
    Promise.all([
      this.messenger
        .request<"backend", account_t[]>("accounts")
        .then((res) => res.data),
      this.messenger
        .request<"backend", position_t[]>("positions")
        .then((res) => res.data),
    ]);

  chart_data = (
    broker: broker_t,
    conid: string,
    period: period_t,
    granularity: period_t,
  ) =>
    this.messenger.request<"backend", stock_data_t>("chart_data", broker, [
      conid,
      period,
      granularity,
    ]);

  static popup_login(url: string, name: string) {
    const width = 600;
    const height = 900;
    const windowFeatures = `popup,innerWidth=${width},innerHeight=${height}`;
    const login_window = window.open(url, name, windowFeatures);
    login_window?.resizeTo(width, height);
    return login_window;
  }

  static fx_pl(p: position_t) {
    const buy = this.buy_value(p);
    const buy_now = this.round_money(
      p.position * p.price_buy * this.fx_round(p.fx_market),
    );

    return buy_now - buy;
  }
  static buy_value(p: position_t) {
    return this.round_money(p.position * p.price_buy * this.fx_round(p.fx_buy));
  }
  static market_value(p: position_t) {
    return this.round_money(p.position * p.price_market * p.fx_market);
  }
  static round_money(amount: number) {
    return Math.round(amount * 100);
  }

  static to_money_string(value: number) {
    if (value === 0) return "0.00";
    let [whole, fraction] = (value / 100).toString().split(".");
    fraction = (fraction || "").padEnd(2, "0");
    return `${whole || "0"}.${fraction}`;
  }
  private static fx_round(rate: number) {
    const rounding = 1000000;
    return Math.round(rate * rounding) / rounding;
  }
}
