import { Global } from "backend";

const browser_script = "./src/scripts/browser.sh";

export default class App extends Global {
  constructor() {
    super();

    this.open_browser();
    this.brokers.init_brokers().catch((err) => logger.error(err));

    this.add_shutdown_fnc(this.close_clients);
    process.on("SIGINT", this.shutdown);
    process.on("SIGTERM", this.shutdown);
    process.on("SIGKILL", this.shutdown);
  }
  add_shutdown_fnc = (fnc: Function) => {
    this.shutdown_fns.push(fnc);
  };
  private open_browser() {
    Bun.spawn([browser_script, this.app.http.url]);
  }
  private close_clients = () => {
    this.ws.publish("shutdown", "");
  };
  private shutdown = () => {
    console.info("");
    console.info("App is shutting down...");
    Promise.all(this.shutdown_fns.map((fnc) => fnc()))
      .then(() => {
        setTimeout(() => {
          console.info("process ended");
          process.exit(0);
        }, 10);
      })
      .catch((err) => {
        logger.error(err);
        process.exit(1);
      });
  };

  private shutdown_fns: Function[] = [];
}
