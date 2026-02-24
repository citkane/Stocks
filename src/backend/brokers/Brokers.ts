import { Saxo } from "./saxo"
import { Ibkr } from "./ibkr";

import type { App } from ".."

export class Brokers {
	constructor(private app: App) {
		this.saxo = new Saxo(this.app);
		this.ibkr = new Ibkr(this.app);
	}
	get_accounts = () => Promise.all([
		this.saxo.accounts.get_accounts(),
		this.ibkr.accounts.get_accounts()
	])
	get_positions = () => Promise.all([
		this.saxo.positions.get_positions(),
	])

	is_authorised = (broker: broker_t) => this[broker].is_authorised()
	get_saxo_code_url = () => this.saxo.get_code_url();
	get_saxo_token = (code: string) => this.saxo.get_token(code);

	private saxo: Saxo
	private ibkr: Ibkr
}
