import { authorise } from "./authorise.ts"
import { login } from "./login.ts"

export { Saxo } from "./Saxo"

export type authorise_f = ReturnType<typeof authorise>
export type login_f = ReturnType<typeof login>


export const factory = {
	authorise,
	login
}
