
import { authorise } from "./authorise"
import { positions } from "./positions"
import { accounts } from "./accounts"

export { Fetch } from "./Fetch"
export { Ibkr } from "./Ibkr"

export type authorise_f = ReturnType<typeof authorise>
export type positions_f = ReturnType<typeof positions>
export type accounts_f = ReturnType<typeof accounts>

export const factory = {
	authorise,
	positions,
	accounts
}
