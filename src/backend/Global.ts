export class Global {
  protected get app() {
    return backend.app;
  }
  protected get broker() {
    return backend.broker;
  }
  protected get cache() {
    return this.app.cache;
  }
  protected get db() {
    return this.app.db;
  }
  protected get api() {
    return this.app.api;
  }
  protected get brokers() {
    return this.app.brokers;
  }
  protected get ws() {
    return this.app.ws;
  }
  protected get http() {
    return this.app.http;
  }
  protected get saxo() {
    return this.broker.saxo;
  }
  protected get ibkr() {
    return this.broker.ibkr;
  }
}
