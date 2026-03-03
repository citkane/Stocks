import { authorise } from "./authorise";
import { positions } from "./positions";
import { Accounts } from "./Accounts";
import { oauth } from "./oauth";

import type { Saxo } from "..";

export { Fetch } from "./Fetch";

export type authorise_f = ReturnType<typeof authorise>;
export type positions_f = ReturnType<typeof positions>;
export type outh_f = ReturnType<typeof oauth>;

export type factory_t = ReturnType<typeof factory>;

export function factory(broker: Saxo) {
  return {
    authorise,
    oauth,
    positions,
    accounts: new Accounts(broker),
  };
}
