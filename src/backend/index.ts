import "../index";
import Logger from "./Logger.ts";
export { Global } from "./Global.ts";

declare global {
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

var logger = Logger;
(globalThis as any).logger = logger;

import { ServerHttp, ServerWs } from "./servers";
import { Database } from "./database";
import { Brokers, BrokerSaxo, BrokerIbkr } from "./brokers";
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
  saxo: new BrokerSaxo(),
  ibkr: new BrokerIbkr(),
};

new App();
