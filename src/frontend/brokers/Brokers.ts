import { Saxo } from "./saxo"
import { Ibkr } from "./ibkr"

import type { App, Cache } from "..";


export class Brokers {
	constructor(private app: App) {
		this.saxo = new Saxo(this.app);
		this.ibkr = new Ibkr(this.app);
		this.cache = this.app.cache;
	}
	authorise = () => Promise.all([
		this.saxo.req_authorise().then(() => console.info("Saxo authorised")),
		this.ibkr.await_login().then(() => console.info("IBKR authorised")),
	]);
	authorised = (success: boolean, broker: broker_t) => {
		this[broker].authorised(success);
	}
	login(broker: broker_t) {
		switch (broker) {
			case "saxo":
				this.saxo.login_backend();
				break;
		}
	}
	get_accounts = () => Promise.all([
		this.saxo.get_accounts(),
	])

	get_positions = () => Promise.all([
		this.saxo.get_positions(),
	])
	position = (position: position_t) => {
		this.cache.add.position(position)
	}
	account = (account: account_t) => {
		this.cache.add.account(account)
	}



	public saxo: Saxo;
	public ibkr: Ibkr;
	private cache: Cache
}
