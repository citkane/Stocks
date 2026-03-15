export class Global {
  get app() {
    return frontend.app;
  }
  get router() {
    return frontend.router;
  }
  get brokers() {
    return frontend.brokers;
  }
  get api() {
    return frontend.api;
  }
  get ws() {
    return frontend.ws;
  }
  get cache() {
    return frontend.cache;
  }
  get events() {
    return frontend.events;
  }
  get saxo() {
    return frontend.saxo;
  }
  get ibkr() {
    return frontend.ibkr;
  }
  get messenger() {
    return this.ws.messenger;
  }
  protected add_shutdown_task = (fn: Function) => {
    this.app.add_shutdown_task(fn);
  };
}
