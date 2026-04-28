const currencies = ["ZAR", "CNH", "HKD", "CHF"] as const;
const base_currency = "EUR";

declare global {
  type currency_t =
    | (typeof currencies)[number]
    | typeof base_currency
    | "ZAC"
    | "GBp";
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
  protected get saxo() {
    return this.broker.saxo;
  }
  protected get ibkr() {
    return this.broker.ibkr;
  }
  protected get currencies() {
    return currencies as unknown as currency_t[];
  }
  protected get base_currency() {
    return base_currency as currency_t;
  }

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
