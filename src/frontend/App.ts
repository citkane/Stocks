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

      //console.info("App awaiting warm cache");
      //await this.brokers.wait_for_cache();
      //await this.warm_the_cache();

      console.info("App ready");
      this.init_components();
      //this.brokers
      //  .chart_data("ibkr", "504513998", [10, "y"], [1, "d"])
      //  .then((res) => console.log(res.data));
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
  //private warm_the_cache = async () => {
  //  const [accounts, positions] = await this.brokers.request_cache();
  //  accounts.forEach(this.cache.add.account);
  //  positions.forEach(this.cache.add.position);
  //};
  private shutdown = async (_e: Event) => {
    console.info("Shutting down");
    await Promise.all(this.shutdown_tasks.map((fnc) => fnc(), []));
    console.info("Shut down");
  };

  private shutdown_tasks: Function[] = [];
}
