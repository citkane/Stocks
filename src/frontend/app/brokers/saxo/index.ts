import { Authorise } from "./Authorise.ts";
import { Login } from "./Login.ts";
export { Authorise, Login };

import type { Saxo } from "frontend";
export type factory_t = ReturnType<typeof factory>;

export function factory(broker: Saxo) {
  return {
    authorise: new Authorise(broker),
    login: new Login(broker),
  };
}
