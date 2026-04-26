export { Global } from "./Global";

declare global {
  namespace frontend {
    var app: App_t;
    var router: Router_t;
    var brokers: Brokers_t;
    var api: Api_t;
    var ws: Ws_t;
    var cache: Cache_t;
    var events: Events_t;
    var saxo: Saxo_t;
    var ibkr: Ibkr_t;
  }
}

import "../index";
import "@frontend/components/index";
import Logger from "./Logger";
import App from "@frontend/App";
import Api from "@frontend/Api";
import {
  Router,
  ClientWs,
  Ibkr,
  Saxo,
  Brokers,
  Events,
} from "@frontend/app/index.ts";
import { Cache } from "./Cache";

(window as any).logger = Logger;
(window as any).frontend = {
  app: new App(),
};
(window as any).frontend = {
  ...frontend,
  brokers: new Brokers(),
  api: new Api(),
  ws: new ClientWs(),
  cache: new Cache(),
  events: new Events(),
  saxo: new Saxo(),
  ibkr: new Ibkr(),
};

try {
  await frontend.ws.connected();
  logger.info("WebSocket connected");
} catch (err) {
  logger.info("WebSocket connection failed");
  logger.error(err);
}

new Router();
