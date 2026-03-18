import "../index";
import Logger from "./Logger.ts";

export { Global } from "./Global.ts";

declare global {
  var logger: backend.Logger_t;
  namespace backend {
    namespace app {
      var api: Api_t;
      var db: Database_t;
      var brokers: Brokers_t;
      var http: Http_t;
      var ws: Ws_t;
    }
    namespace broker {
      var saxo: Saxo_t;
      var ibkr: Ibkr_t;
    }
  }
}

(globalThis as any).logger = Logger;

import { ServerHttp, ServerWs } from "./servers";
import { Database } from "./database";
import { Brokers, Saxo, Ibkr } from "./brokers";
import Api from "./Api.ts";
import App from "./App.ts";

(globalThis as any).backend.app = {
  http: new ServerHttp(),
  ws: new ServerWs(),
  brokers: new Brokers(),
  api: new Api(),
  db: new Database(),
};

(globalThis as any).backend.broker = {
  saxo: new Saxo(),
  ibkr: new Ibkr(),
};

new App();
