import { Global } from "@frontend/Global";

export default class App extends Global {
  constructor() {
    super();
    window.addEventListener("beforeunload", this.shutdown);
  }
  public run = async () => {
    const { bootstrap_mess, bootstrap_end, messenger, cache, auth } = this;

    bootstrap_mess("App awaiting cache");
    const [instrmnts, qid_map, lv_positns] = await Promise.all([
      messenger.request<g.meta_view[]>("meta"),
      messenger.request<g.qid_map>("qid_map"),
      messenger.request<lv.positn[]>("lv_positns"),
    ]);

    this.instrmnts(qid_map, instrmnts);
    this.positns(lv_positns);
    const promises = conf.brokers.map((broker) =>
      this.messenger.request<boolean>("auth_state", broker),
    );
    const logged_in = await Promise.all(promises);

    auth(!logged_in.includes(false));
    bootstrap_end();
  };
  public positns = (positns: lv.positn[]) => {
    this.cache.set.positions(positns);
    const hash = util.hash_id(positns);
    this.el_app_root.setAttribute("positns", hash);
    this.el_insight_root.setAttribute("positns", hash);
  };
  public auth = (state: boolean) => {
    this.el_app_root.setAttribute("auth", JSON.stringify(state));
  };
  public login = async () => {
    this.bootstrap_mess("App awaiting authorisation");
    await this.brokers.await_login();
  };
  private instrmnts = (map: g.qid_map, instrmnts: g.meta_view[]) => {
    this.cache.set.qid_map(map); // before meta
    this.cache.set.instrmnts(instrmnts);
    const hash = util.hash_id(instrmnts);
    this.el_app_root.setAttribute("instrmnts", hash);
    this.el_insight_root.setAttribute("instrmnts", hash);
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
