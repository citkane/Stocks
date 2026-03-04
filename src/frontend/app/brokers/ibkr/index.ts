import { Login } from "./Login.ts";
export { Login };

import type { Ibkr } from "frontend";
export type factory_t = ReturnType<typeof factory>;

export function factory(broker: Ibkr) {
  return {
    login: new Login(broker),
  };
}
