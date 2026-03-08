import { Authorise } from "./Authorise";
import { Positions } from "./Positions";
import { Accounts } from "./Accounts";
import type { Ibkr } from "..";

export { Fetch } from "./Fetch";
export { Authorise, Positions, Accounts };
export type factory_t = ReturnType<typeof factory>;

export function factory(broker: Ibkr) {
  return {
    authorise: new Authorise(broker),
    positions: new Positions(broker),
    accounts: new Accounts(broker),
  };
}
