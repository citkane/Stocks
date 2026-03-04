import { ServerHttp, ServerWs, Api, Brokers, Cache } from "backend";

const browser_script = "./src/scripts/browser.sh";

export class App {
  constructor() {
    this.http = new ServerHttp();
    this.api = new Api();
    this.ws = new ServerWs(this);
    this.cache = new Cache();
    this.brokers = new Brokers(this);

    this.api.init(this);
    this.open_browser();
    this.brokers.init();

    this.add_shutdown_fnc(this.close_clients);
    process.on("SIGINT", this.shutdown);
    process.on("SIGTERM", this.shutdown);
    process.on("SIGKILL", this.shutdown);
  }
  add_shutdown_fnc = (fnc: Function) => {
    this.shutdown_fncs.push(fnc);
  };
  private open_browser() {
    Bun.spawn([browser_script, this.http.url]);
  }
  private close_clients = () => {
    this.ws.publish("shutdown", "");
  };
  private shutdown = () => {
    console.info("");
    console.info("App is shutting down...");
    Promise.all(this.shutdown_fncs.map((fnc) => fnc()))
      .then(() => {
        setTimeout(() => {
          console.info("process ended");
          process.exit(0);
        }, 10);
      })
      .catch((err) => {
        console.error(err);
        process.exit(1);
      });
  };

  public api: Api;
  public brokers: Brokers;
  public ws: ServerWs;
  public http: ServerHttp;
  public cache: Cache;

  private shutdown_fncs: Function[] = [];
}
