import { Messenger, Ws } from "common";

export class ClientWs extends Ws {
  constructor() {
    super();
    const ws = new WebSocket(`ws://127.0.0:${conf.ws_port}`);
    this.messenger = new Messenger(ws, "frontend");

    ws.addEventListener("message", (event) => this.router(event.data));
    ws.addEventListener("open", (event) => this.is_connected.resolve(event));
    ws.addEventListener("close", (_event) => {});
    ws.addEventListener("error", (event) => this.is_connected.reject(event));
  }

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
  private is_connected = util.resolver.empty();
  private get api() {
    return frontend.api;
  }
}
