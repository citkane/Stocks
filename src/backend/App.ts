import { Global } from "backend";

const browser_script = "./src/scripts/browser.sh";

export default class App extends Global {
  constructor() {
    super();
    this.add_shutdown_fncs(this.close_clients, logger.shutdown);

    this.brokers.init();
    this.open_browser();

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
