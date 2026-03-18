declare global {
  type exchanges_t = keyof typeof exchanges;
}

import exchanges from "./exchanges_map.json";

export { Ws } from "./Ws.ts";
export * from "./Util.ts";
export * from "./Messenger.ts";
export { exchanges };
