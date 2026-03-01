import { Saxo } from "./saxo"
import { Ibkr } from "./ibkr"

import type { App, Cache, Messenger } from "..";

const account_headers = ["broker", "alias", "currency", "id"]
const stock_headers = ["description", "ticker", "positions"]
const positions_headers = ["broker", "exchange", "id"]


export class Brokers {
	constructor(private app: App) {
		this.saxo = new Saxo(this.app);
		this.ibkr = new Ibkr(this.app);
		this.cache = this.app.cache;
		this.messenger = this.app.ws.messenger;
	}
	static get account_headers() { return account_headers }
	static get stock_headers() { return stock_headers }
	static get positions_headers() { return positions_headers }


	static popup_login(url: string, name: string) {
		const width = 600;
		const height = 900;
		const windowFeatures = `popup,innerWidth=${width},innerHeight=${height}`;
		const login_window = window.open(url, name, windowFeatures);
		login_window?.resizeTo(width, height);
		return login_window;
	}

	authorise = () => Promise.all([
		this.saxo.req_authorise().then(() => console.info("Saxo authorised")),
		this.ibkr.await_login().then(() => console.info("IBKR authorised")),
	]);
	authorised = (success: boolean, broker: broker_t) => {
		//console.log("BROKER: ", broker)
		this[broker].authorised(success);
	}
	saxo_login = () => this.saxo.login_backend();

	get_accounts = () => this.messenger.request<"backend", boolean>("accounts")
		.then(() => console.info("Got accounts"))

	get_positions = () => this.messenger.request<"backend", boolean>("positions")
		.then(() => console.info("Got positions"))


	position = (position: position_t) => {
		this.cache.add.position(position)
	}
	account = (account: account_t) => {
		this.cache.add.account(account)
	}
	public saxo: Saxo;
	public ibkr: Ibkr;
	private cache: Cache
	private messenger: Messenger
}
