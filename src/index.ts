import conf_json from "../conf.jsonc";
import { Util, Messenger } from "./common";
export * from "types";

conf_json.brokers = Object.keys(conf_json.brokers).filter(
  (broker) => conf_json.brokers[broker],
) as broker_t[];

declare global {
  const conf: conf_t;
  const util: typeof Util;
  namespace backend {}
  namespace frontend {}
}

(globalThis as any).conf = conf_json as conf_t;
(globalThis as any).util = Util;
(globalThis as any).messenger = Messenger;
(globalThis as any).backend = {};
(globalThis as any).frontend = {};
