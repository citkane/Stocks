import { Authorise } from "./Authorise.ts";
import { Positions } from "./Positions.ts";
import { Accounts } from "./Accounts.ts";
import { Oauth } from "./Oauth.ts";
import type { Saxo } from "backend";

export { Fetch } from "./Fetch";
export type factory_t = ReturnType<typeof factory>;
export { Authorise, Positions, Accounts, Oauth };

export function factory(broker: Saxo, base_uri: string) {
  return {
    authorise: new Authorise(broker, base_uri),
    oauth: new Oauth(broker, base_uri),
    positions: new Positions(broker),
    accounts: new Accounts(broker),
  };
}
