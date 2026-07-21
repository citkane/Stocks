import { Global } from "@frontend/Global";

export default class App extends Global {
  constructor() {
    super();
    window.addEventListener("beforeunload", this.shutdown);
  }
  public run = async () => {
    const { bootstrap_mess, bootstrap_end, messenger } = this;

    bootstrap_mess("App awaiting cache");
    const [instrmnts, geo_map, positns, accnts, balances] = await Promise.all([
      messenger.request<g.meta_view[]>("instrmnts"),
      messenger.request<g.geo_map>("geo_map"),
      messenger.request<lv.positn[]>("positns"),
      messenger.request<g.account[]>("accnts"),
      messenger.request<lv.balance[]>("balances"),
    ]);

    this.instrmnts(geo_map, instrmnts);
    this.positns(positns);
    this.accnts(accnts);
    await this.logged_in();

    bootstrap_end();
  };
  public accnts = (accnts: g.account[]) => {
    this.cache.set.accnts(accnts);
    const hash = util.hash_id(accnts);
    this.el_app_root.setAttribute("accnts", hash);
  };
  public positns = (positns: lv.positn[]) => {
    this.cache.set.positions(positns);
    const hash = util.hash_id(positns);
    this.el_app_root.setAttribute("positns", hash);
  };
  public balances = (balances: lv.balance[]) => {
    this.cache.set.balances(balances);
    const hash = util.hash_id(balances);
    this.el_app_root.setAttribute("balances", hash);
  };
  private instrmnts = (geo_map: g.geo_map, instrmnts: g.meta_view[]) => {
    this.cache.set.geo_map(geo_map); // before meta
    this.cache.set.instrmnts(instrmnts);
    const hash = util.hash_id(instrmnts);
    this.el_app_root.setAttribute("instrmnts", hash);
  };
  public auth = (state: boolean) => {
    this.el_app_root.setAttribute("auth", JSON.stringify(state));
  };
  public login = async () => {
    this.bootstrap_mess("App awaiting authorisation");
    await this.brokers.await_login();
  };

  public override add_shutdown_task = (task: Function) => {
    this.shutdown_tasks.push(task);
  };
  private shutdown = async (_e: Event) => {
    logger.info("Shutting down");
    await Promise.all(this.shutdown_tasks.map((fnc) => fnc(), []));
    logger.info("Shut down");
  };
  private logged_in = async () => {
    const promises = conf.brokers.map((broker) =>
      this.messenger.request<boolean>("auth_state", broker),
    );
    const logged_in = !(await Promise.all(promises)).includes(false);
    this.auth(logged_in);
  };

  private shutdown_tasks: Function[] = [];
}
