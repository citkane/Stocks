import { Messenger, Ws } from "common";

export class ServerWs extends Ws {
  constructor() {
    super();
    this.ws = Bun.serve({
      port: conf.ws_port,
      fetch: this.ws_fetch,
      websocket: {
        message: (ws, message) => this.router(ws, message.toString()),
        open: this.ws_open,
        close: this.ws_close,
        drain: this.ws_drain,
      },
    });
  }

  publish(topic: frontend.set_topic_t, data?: data_t, params?: string[]) {
    const mess = Messenger.encode(
      topic,
      data || "",
      undefined,
      undefined,
      params,
    );
    this.ws.publish(topic, mess);
  }

  private router(ws: ws_t, data: string) {
    const mssg = Messenger.decode(data);
    const messenger = this.messengers.get(ws)!;
    const requests = messenger.requests;

    this.route(this.api, requests, messenger, mssg);
  }

  private ws_fetch(req: Request, server: Bun.Server<undefined>) {
    if (server.upgrade(req)) return;
    return new Response("Upgrade failed", { status: 500 });
  }
  private ws_open = (ws: Bun.ServerWebSocket) => {
    const messenger = new Messenger(ws);
    this.messengers.set(ws, messenger);
    !!this.target_topics
      ? this.subscribe_all(ws)
      : this.request_frontend_topics(ws, messenger);
  };
  private ws_close = (ws: Bun.ServerWebSocket) => {
    this.messengers.delete(ws);
    setTimeout(() => {
      if (!this.messengers.size) process.exit(0);
    }, 1000);
  };
  private ws_drain = (_ws: Bun.ServerWebSocket) => {};

  private request_frontend_topics(
    ws: Bun.ServerWebSocket,
    messenger: Messenger,
  ) {
    messenger
      .request<"frontend", frontend.set_topic_t[]>("topics")
      .then((message) => {
        this.target_topics = message.data;
        this.subscribe_all(ws);
      });
  }
  private subscribe_all(ws: Bun.ServerWebSocket) {
    this.target_topics?.forEach((topic) => {
      ws.subscribe(topic);
    });
  }

  private get api() {
    return backend.app.api;
  }
  private ws: Bun.Server<undefined>;
  private target_topics?: frontend.set_topic_t[];
  private messengers = new Map<ws_t, Messenger>();
}
