import { Global } from "backend";

const browser_script = "./src/scripts/browser.sh";

export default class App extends Global {
  constructor() {
    super();

    this.open_browser();
    this.add_shutdown_fnc(this.close_clients);

    this.brokers
      .init_brokers()
      .then(this.ibkr.update.fx)
      .then(this.brokers.update.accounts)
      .then(this.brokers.update.positions)
      .catch((err) => console.error(err));
    //.then(() => console.log(this.brokers.cache.accounts)); //.catch((err) => logger.error(err));

    process.on("SIGINT", this.shutdown);
    process.on("SIGTERM", this.shutdown);
    process.on("SIGKILL", this.shutdown);
    process.on("beforeExit", this.shutdown);
  }

  private open_browser() {
    Bun.spawn([browser_script, this.app.http.url]);
  }
  private close_clients = () => {
    this.ws.publish("shutdown", "");
  };
}
