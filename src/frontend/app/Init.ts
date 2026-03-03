import type { Api, Events, Cache, Brokers } from ".";
import type { Messenger } from "../..";
import type { App } from "../App";
import type { Ibkr, Saxo } from "./broker";
import type { ClientWs } from "./servers";

export class Init {
  public init = (app: App) => {
    this.app = app;
    this.api = app.api;
    this.brokers = app.brokers;
    this.cache = app.cache;
    this.events = app.events;
    this.messenger = app.messenger;
    this.saxo = app.saxo; //new Saxo(this.app);
    this.ibkr = app.ibkr; //new Ibkr(this.app);
  };

  protected add_shutdown_task = (fn: Function) => {
    this.app
      ? this.app.add_shutdown_task(fn)
      : setTimeout(() => {
          this.add_shutdown_task(fn);
        });
  };

  public messenger!: Messenger;
  protected app!: App;
  protected brokers!: Brokers;
  protected api!: Api;
  protected ws!: ClientWs;
  protected cache!: Cache;
  protected events!: Events;
  protected saxo!: Saxo;
  protected ibkr!: Ibkr;
}
