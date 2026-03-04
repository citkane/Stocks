import "@types/frontend.ts";
import type { Messenger } from "types";
import type {
  ClientWs,
  Api,
  Brokers,
  Events,
  Cache,
  Saxo,
  Ibkr,
} from "frontend";

export class App {
  constructor(
    public brokers: Brokers,
    public api: Api,
    public ws: ClientWs,
    public cache: Cache,
    public events: Events,
    public messenger: Messenger,
    public saxo: Saxo,
    public ibkr: Ibkr,
  ) {
    window.app = this;
    this.init_app();

    window.addEventListener("beforeunload", this.shutdown);
  }

  public run = async () => {
    try {
      console.info("App awaiting authorisation");
      await this.brokers.authorise_brokers();

      console.info("App awaiting warm cache");
      await this.brokers.is_data_ready();
      await this.warm_the_cache();

      console.info("App ready");
      this.init_components();
    } catch (err) {
      console.error(err);
    }
  };
  public add_shutdown_task = (task: Function) => {
    this.shutdown_tasks.push(task);
  };

  private init_app = () => {
    this.api.init(this);
    this.ws.init(this);
    this.brokers.init(this);
    this.api.init(this);
    this.saxo.init(this);
    this.ibkr.init(this);
  };
  private init_components = () => {
    const app_element = document.getElementsByTagName("app-root")[0];
    app_element?.setAttribute("ready", "true");
  };
  private warm_the_cache = async () => {
    const [accounts, positions] = await this.brokers.request_data();
    accounts.forEach(this.cache.add.account);
    positions.forEach(this.cache.add.position);
  };
  private shutdown = async (_e: Event) => {
    console.info("Shutting down");
    await Promise.all(this.shutdown_tasks.map((fnc) => fnc(), []));
    console.info("Shut down");
  };

  private shutdown_tasks: Function[] = [];
}
