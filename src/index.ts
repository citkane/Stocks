import conf_json from "../conf.json";
import { Util, Messenger } from "./common";

export * from "types";

declare global {
  const conf: typeof conf_json;
  const util: typeof Util;
  namespace backend {}
  namespace frontend {}
}
(globalThis as any).conf = conf_json;
(globalThis as any).util = Util;
(globalThis as any).messenger = Messenger;
(globalThis as any).backend = {};
(globalThis as any).frontend = {};
