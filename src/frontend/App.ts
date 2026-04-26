import { Global } from "@frontend/Global";

export default class App extends Global {
  constructor() {
    super();
    window.addEventListener("beforeunload", this.shutdown);
  }

  public run = async () => {
    try {
      logger.info("App awaiting authorisation");
      await this.brokers.await_login();
      await this.brokers.request_cache();

      //logger.info("App awaiting cache");
      //const [accounts, transactions, instruments] =
      //  await this.brokers.request_cache();
      //
      //this.cache.accounts = accounts;
      //this.cache.transactions = transactions;
      //this.cache.instruments = instruments;
      //
      //logger.info("App ready");
      //this.init_components();
    } catch (err) {
      logger.error(err);
    }
  };
  public override add_shutdown_task = (task: Function) => {
    this.shutdown_tasks.push(task);
  };

  //private init_components = () => {
  //  const app_element = document.getElementsByTagName("app-root")[0];
  //  app_element?.setAttribute("ready", "true");
  //};

  private shutdown = async (_e: Event) => {
    logger.info("Shutting down");
    await Promise.all(this.shutdown_tasks.map((fnc) => fnc(), []));
    logger.info("Shut down");
  };

  private shutdown_tasks: Function[] = [];
}
