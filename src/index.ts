import { default as conf_json } from "../conf.json";
import { Util, Messenger } from "./common";
export * from "types";

(conf_json.brokers as any) = Object.keys(conf_json.brokers).filter(
  (broker) => conf_json.brokers[broker as keyof typeof conf_json.brokers],
) as g.broker[];

declare global {
  const conf: Omit<typeof conf_json, "brokers"> & {
    brokers: g.broker[];
  };
  const util: typeof Util;
  namespace backend {}
  namespace frontend {}
}

(globalThis as any).conf = conf_json;
(globalThis as any).util = Util;
(globalThis as any).messenger = Messenger;
(globalThis as any).backend = {};
(globalThis as any).frontend = {};
