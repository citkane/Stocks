import { Authorise } from "./Authorise.ts";
import { Login } from "./Login.ts";

import type { Saxo } from "../index.ts";

export type factory_t = ReturnType<typeof factory>;

export function factory(broker: Saxo) {
  return {
    authorise: new Authorise(broker),
    login: new Login(broker),
  };
}
