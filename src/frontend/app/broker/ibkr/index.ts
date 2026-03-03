import { Login } from "./Login.ts";

import type { Ibkr } from "../Ibkr.ts";

export type factory_t = ReturnType<typeof factory>;

export function factory(broker: Ibkr) {
  return {
    login: new Login(broker),
  };
}
