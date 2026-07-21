import { Global } from "@frontend/Global";

export default class Api extends Global implements Api_t {
  req = {
    topics: (p: req_t) => p.messenger.response(p.req_uid, this.topics),
  };
  on = {
    shutdown: () => window.close(),
    bootstrap: (message: string) => this.bootstrap_mess(`[backend] ${message}`),
    auth: (state: boolean) => this.app.auth(state),
    positns: (positns: lv.positn[]) => this.app.positns(positns),
    balances: (balances: lv.balance[]) => this.app.balances(balances),
  };
  private get topics() {
    return Object.keys(this.on);
  }
}
