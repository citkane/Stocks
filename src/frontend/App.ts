import { Global } from "@frontend/Global";

export default class App extends Global {
  constructor() {
    super();
    window.addEventListener("beforeunload", this.shutdown);
  }

  public run = async () => {
    try {
      console.info("App awaiting authorisation");
      await this.brokers.await_login();

      console.info("App awaiting cache");
      const [accounts, positions] = await this.brokers.request_cache();
      this.cache.accounts = accounts;
      this.cache.transactions = positions;

      console.info("App ready");
      this.init_components();
    } catch (err) {
      console.error(err);
    }
  };
  public override add_shutdown_task = (task: Function) => {
    this.shutdown_tasks.push(task);
  };

  private init_components = () => {
    const app_element = document.getElementsByTagName("app-root")[0];
    app_element?.setAttribute("ready", "true");
  };

  private shutdown = async (_e: Event) => {
    console.info("Shutting down");
    await Promise.all(this.shutdown_tasks.map((fnc) => fnc(), []));
    console.info("Shut down");
  };

  private shutdown_tasks: Function[] = [];
}
