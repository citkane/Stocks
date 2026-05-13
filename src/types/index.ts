import type { Messenger } from "@common/Messenger";
import type Logger from "@common/Logger";

import type Api_b from "@backend/Api";
import type { Brokers as Brokers_b } from "@backend/brokers";
import type { Database as Database_b } from "@backend/database";

import type { ServerHttp, ServerWs } from "@backend/servers";

import type App_f from "@frontend/App";
import type Api_f from "@frontend/Api";
import type Cache_f from "@frontend/Cache";
import type Router_f from "@frontend/Router";
import type { ClientWs as Ws_f } from "@frontend/app/servers";
import type { Brokers as Brokers_f } from "@frontend/app/Brokers";

export type * as saxo_t from "./saxo_t";
export type * as ibkr_t from "./ibkr_t";

declare global {
  type Messenger_t = typeof Messenger;
  type Logger_t = typeof Logger;
  var logger: Logger_t;

  namespace backend {
    type Brokers_t = Brokers_b;
    type Database_t = Database_b;
    type Http_t = ServerHttp;
    type Ws_t = ServerWs;
    type Api_t = Api_b;
  }
  namespace frontend {
    type App_t = App_f;
    type Router_t = Router_f;
    type ClientWs_t = Ws_f;
    type Brokers_t = Brokers_f;
    type Cache_t = Cache_f;
    type Api_t = Api_f;
    type Ws_t = Ws_f;
  }
}
