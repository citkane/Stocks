import { login } from "./login.ts"

export { Ibkr } from "./Ibkr"
export type login_f = ReturnType<typeof login>

export const factory = {
	login
}
