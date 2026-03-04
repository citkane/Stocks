import * as conf from "conf";
import { Messenger, Ws, util } from "common";

import type { Api } from "../../app";
import type { App } from "../../App";

export class ClientWs extends Ws {
  constructor() {
    super();
    const ws = new WebSocket(`ws://0.0.0:${conf.ws_port}`);
    this.messenger = new Messenger(ws);

    ws.addEventListener("message", (event) => this.router(event.data));
    ws.addEventListener("open", (event) => this.is_connected.resolve(event));
    ws.addEventListener("close", (_event) => {});
    ws.addEventListener("error", (event) => this.is_connected.reject(event));
  }

  public init = (app: App) => {
    this.api = app.api;
  };

  public connected() {
    return new Promise((resolve, reject) => {
      this.is_connected = { resolve, reject };
    });
  }

  private router(data: string) {
    const mssg = Messenger.decode(data);

    const messenger = this.messenger;
    const { requests } = messenger;

    this.route(this.api, requests, messenger, mssg);
  }

  public messenger: Messenger;
  private is_connected = util.blank_resolver();
  private api!: Api;
}
