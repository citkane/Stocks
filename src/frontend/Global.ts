import type {
  AccountsRoot,
  InsightWrapper,
  InstrumentsRoot,
} from "@frontend/components";

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
  protected get el_bootstrap() {
    return document.getElementById("bootstrap");
  }
  protected get el_app_root() {
    return document.querySelector("app-root")!;
  }
  protected get el_accounts_root() {
    return document.querySelector<AccountsRoot>("accounts-root")!;
  }
  protected get el_instruments_root() {
    return document.querySelector<InstrumentsRoot>("instrmnts-root")!;
  }
  protected get el_insight_root() {
    return document.querySelector<InsightWrapper>("insight-wrapper")!;
  }
  protected get els_root() {
    return [
      this.el_accounts_root,
      this.el_instruments_root,
      this.el_insight_root,
    ];
  }

  protected bootstrap_mess = (message: string) => {
    logger.info(message);
    this.el_bootstrap?.append(`\n${message}`);
  };
  protected bootstrap_end = () => {
    this.el_app_root.removeAttribute("hidden");
    this.el_bootstrap?.remove();
  };

  protected add_shutdown_task = (fn: Function) => {
    this.app.add_shutdown_task(fn);
  };
}
