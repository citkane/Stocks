export class Global {
  protected get app() {
    return backend;
  }
  //protected get broker() {
  //  return backend.broker;
  //}
  protected get db() {
    return backend.db;
  }
  //protected get api() {
  //  return this.app.api;
  //}
  protected get brokers() {
    return backend.brokers;
  }
  protected get ws() {
    return backend.ws;
  }
  protected get http() {
    return backend.http;
  }
  protected get tv() {
    return backend.tv;
  }
  protected get wd() {
    return backend.wd;
  }
  protected get saxo() {
    return backend.saxo;
  }
  protected get ibkr() {
    return backend.ibkr;
  }

  protected get root_currency() {
    return conf.root_currency;
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
