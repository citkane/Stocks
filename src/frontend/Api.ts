import { Global } from "@frontend/Global";

export default class Api extends Global implements Api_t {
  requests = {
    topics: (p: req_t) => p.messenger.response(p.req_uid, this.topics),
  };
  setter = {
    shutdown: () => window.close(),
    bootstrap: (message: string) => this.bootstrap_mess(`[backend] ${message}`),
    auth: (state: boolean) => this.app.auth(state),
    positns: (positns: lv.positn[]) => this.app.positns(positns),
  };
  private get topics() {
    return Object.keys(this.setter);
  }
}
