import { Global } from "@frontend/Global";

export default class Api extends Global implements Api_t {
  requests = {
    topics: (p: req_t) => p.messenger.response(p.req_uid, this.topics),
  };
  setter = {
    //backend_ready: () => this.brokers!.wait_for_cache(),
    //position: (position: position_t) => this.brokers.cache_position(position),
    //account: (account: account_t) => this.brokers.cache_account(account),
    shutdown: () => window.close(),
    instruments: (instrmnts: instrmnt_t[]) => {
      this.cache.instruments = instrmnts;
      this.set_instruments();
    },
    transactions: (transctns: transctn_t[]) => {
      this.cache.transactions = transctns;
      this.set_transactions();
    },
    live_data: (data: live_data_t[]) => {
      this.cache.live_data = data;
      this.set_transactions();
    },
  };

  private set_transactions = () => {
    const data = util.html.json_stringify(this.cache.transactions);
    this.root_app.setAttribute("transactions", data);
  };
  private set_instruments = () => {
    const data = util.html.json_stringify(this.cache.instruments);
    this.root_app.setAttribute("instruments", data);
  };
  private get topics() {
    return Object.keys(this.setter);
  }
}
