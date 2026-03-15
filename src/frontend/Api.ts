import { Global } from "@frontend/Global";

export default class Api extends Global implements Api_t {
  constructor() {
    super();
  }
  request = {
    topics: (p: req_t) => p.messenger.response(p.req_uid, this.topics),
  };
  set = {
    backend_ready: () => this.brokers!.wait_for_cache(),
    position: (position: position_t) => this.brokers.cache_position(position),
    account: (account: account_t) => this.brokers.cache_account(account),
    shutdown: () => window.close(),
  };

  private get topics() {
    return Object.keys(this.set);
  }
}
