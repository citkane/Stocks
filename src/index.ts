import conf_json from "../conf.jsonc";
import { Util, Messenger } from "./common";

export * from "types";

declare global {
  const conf: conf_t;
  const util: typeof Util;
  namespace backend {}
  namespace frontend {}
}

(globalThis as any).conf = conf_json;
(globalThis as any).util = Util;
(globalThis as any).messenger = Messenger;
(globalThis as any).backend = {};
(globalThis as any).frontend = {};

type conf_t = {
  http_port: number;
  ws_port: number;
  saxo: {
    start_date: `${string}-${string}-${string}`;
    app_key: string;
    app_secret: string;
    redirect: string;
  };
  ibkr: {
    start_date: `${string}-${string}-${string}`;
    base: string;
  };
};
