import { factory, type login_f } from "."
import type { App, Messenger } from "../..";



export class Ibkr {
	constructor(protected app: App) {
		this.messenger = this.app.ws.messenger;
		this.login = factory.login.bind(this)();

		this.app.add_shutdown_task(this.login.popup_close)
	}
	await_login = () => this.login.await_login();
	authorised = (_success: boolean) => this.login.got_login();

	get_accounts() {
		return this.messenger.request<"backend", boolean>("req_accounts")
			.then(() => console.info("Got Saxo accounts"))
	}
	get_positions() {
		return this.messenger.request<"backend", boolean>("req_positions")
			.then(() => console.info("Got Saxo positions"))
	}

	protected login: login_f
	protected messenger: Messenger;
}


