import "./components";
import { App } from "./App.ts";
import { Router, ClientWs } from "./app/servers";
import { Ibkr, Saxo } from "./app/broker/index.ts";
import { Brokers } from "./app/Brokers.ts";
import { Api } from "./app/Api.ts";
import { Events } from "./app/Events.ts";
import { Cache } from "./app/Cache.ts";

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
