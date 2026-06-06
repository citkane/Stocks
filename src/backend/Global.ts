const base_currency: currency_t = "EUR";

declare global {
  type currency_t = `${string}${string}${string}`;
  type fx_rates_t = { [T in currency_t]: number };
}

export class Global {
  protected get app() {
    return backend.app;
  }
  protected get broker() {
    return backend.broker;
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
  protected get tv() {
    return this.app.tv;
  }
  protected get wd() {
    return this.app.wd;
  }
  protected get saxo() {
    return this.broker.saxo;
  }
  protected get ibkr() {
    return this.broker.ibkr;
  }

  protected get base_currency() {
    return base_currency;
  }
  public bootstrap = (message: string) => {
    logger.info(message);
    this.ws.publish("bootstrap", message);
  };
  protected add_shutdown_fncs = (...fncs: Function[]) => {
    fncs.forEach((fnc) => this.shutdown_fns.push(fnc));
  };
  protected shutdown = (code: any) => {
    console.info("");
    logger.info(code, "App is shutting down...");
    Promise.all(this.shutdown_fns.map((fnc) => fnc()))
      .then(() => {
        setTimeout(() => {
          logger.info("process ended");
          process.exit(0);
        }, 10);
      })
      .catch((err) => {
        //logger.error(err);
        //process.exit(1);
      });
  };

  private shutdown_fns: Function[] = [];
}
