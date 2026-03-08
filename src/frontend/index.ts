import "@frontend/components/index";
import { App } from "@frontend/App";
import { Api } from "@frontend/Api";
import {
  Router,
  ClientWs,
  Ibkr,
  Saxo,
  Brokers,
  Events,
  Cache,
} from "@frontend/app/index.ts";

export * from "@frontend/Api.ts";
export * from "@frontend/app/index.ts";
export { App, Api };

const brokers = new Brokers();
const api = new Api();
const ws = new ClientWs();
const cache = new Cache();
const events = new Events();
const saxo = new Saxo();
const ibkr = new Ibkr();

const app = new App(brokers, api, ws, cache, events, ws.messenger, saxo, ibkr);

try {
  await ws.connected();
  console.info("WebSocket connected");
} catch (err) {
  console.info("WebSocket connection failed");
  console.error(err);
}

new Router(app);
