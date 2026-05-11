export class Global {
  protected get app() {
    return frontend.app;
  }
  protected get router() {
    return frontend.router;
  }
  protected get brokers() {
    return frontend.brokers;
  }
  protected get api() {
    return frontend.api;
  }
  protected get ws() {
    return frontend.ws;
  }
  protected get cache() {
    return frontend.cache;
  }
  protected get events() {
    return frontend.events;
  }
  protected get saxo() {
    return frontend.saxo;
  }
  protected get ibkr() {
    return frontend.ibkr;
  }
  protected get messenger() {
    return this.ws.messenger;
  }
  protected get request() {
    return this.messenger.request;
  }
  protected get send() {
    return this.messenger.send;
  }
  protected get bootstrap() {
    return document.getElementById("bootstrap");
  }
  protected get app_root() {
    return document.querySelector("app-root")!;
  }
  protected get accounts_root() {
    return document.querySelector("accounts-root")!;
  }
  protected get instruments_root() {
    return document.querySelector("instrmnts-root")!;
  }
  protected bootstrap_mess = (message: string) => {
    logger.info(message);
    this.bootstrap?.append(`\n${message}`);
  };
  protected bootstrap_end = () => {
    this.app_root.removeAttribute("hidden");
    this.bootstrap?.remove();
  };

  protected add_shutdown_task = (fn: Function) => {
    this.app.add_shutdown_task(fn);
  };
}
