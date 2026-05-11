import { Global } from "@frontend/Global";

export default class App extends Global {
  constructor() {
    super();
    window.addEventListener("beforeunload", this.shutdown);
  }

  public run = async () => {
    this.bootstrap_mess("App awaiting authorisation");
    await this.brokers.await_login();
    this.bootstrap_mess("App awaiting cache");
    this.brokers.cache_init();
  };

  public override add_shutdown_task = (task: Function) => {
    this.shutdown_tasks.push(task);
  };
  private shutdown = async (_e: Event) => {
    logger.info("Shutting down");
    await Promise.all(this.shutdown_tasks.map((fnc) => fnc(), []));
    logger.info("Shut down");
  };

  private shutdown_tasks: Function[] = [];
}
