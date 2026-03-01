import { Saxo } from "./saxo"
import { Ibkr } from "./ibkr";

import type { App } from ".."
import type { Cache } from "../Cache";
import type { ServerWs } from "../servers";

export class Brokers {
	constructor(private app: App) {
		this.saxo = new Saxo(this.app);
		this.ibkr = new Ibkr(this.app);
		this.cache = this.app.cache;
		this.ws = this.app.ws;
	}
	get_accounts = () => Promise.all([
		this.saxo.accounts.get_accounts(),
		this.ibkr.accounts.get_accounts()
	]).then(() => this.cache.accounts?.forEach(acc => this.ws.publish("account", acc)))

	get_positions = () => Promise.all([
		this.saxo.positions.get_positions(),
		this.ibkr.get_positions()
	]).then(() => this.cache.positions?.forEach(poss => this.ws.publish("position", poss)))

	is_authorised = (broker: broker_t) => this[broker].is_authorised()
	get_saxo_code_url = () => this.saxo.get_code_url();
	get_saxo_token = (code: string) => this.saxo.get_token(code);

	private saxo: Saxo
	private ibkr: Ibkr
	private cache: Cache
	private ws: ServerWs
}
