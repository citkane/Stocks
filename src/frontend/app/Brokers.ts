import { Init } from "@frontend/app/Init";

const account_headers = ["broker", "alias", "currency", "id"];
const stock_headers = ["description", "ticker", "positions"];
const positions_headers = ["broker", "exchange", "id"];

export class Brokers extends Init {
  constructor() {
    super();
  }

  static get account_headers() {
    return account_headers;
  }
  static get stock_headers() {
    return stock_headers;
  }
  static get positions_headers() {
    return positions_headers;
  }

  static popup_login(url: string, name: string) {
    const width = 600;
    const height = 900;
    const windowFeatures = `popup,innerWidth=${width},innerHeight=${height}`;
    const login_window = window.open(url, name, windowFeatures);
    login_window?.resizeTo(width, height);
    return login_window;
  }

  authorise_brokers = () =>
    Promise.all([
      this.saxo.req_authorise().then(() => console.info("Saxo authorised")),
      this.ibkr.await_login().then(() => console.info("IBKR authorised")),
    ]);
  set_broker_authorised = (success: boolean, broker: broker_t) => {
    this[broker].authorised(success);
  };
  saxo_login = () => this.saxo.login_backend();
  is_data_ready = () => this.messenger.request("is_data_ready");

  position = (position: position_t) => {
    this.cache.add.position(position);
  };
  account = (account: account_t) => {
    this.cache.add.account(account);
  };
  async request_data() {
    return Promise.all([
      this.messenger
        .request<"backend", account_t[]>("accounts")
        .then((res) => res.data),
      this.messenger
        .request<"backend", position_t[]>("positions")
        .then((res) => res.data),
    ]);
  }
}
