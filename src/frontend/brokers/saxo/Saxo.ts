import { factory, type authorise_f, type login_f } from "."
import type { App, Messenger } from "../..";



export class Saxo {
	constructor(protected app: App) {
		this.messenger = this.app.ws.messenger;
		this.auth = factory.authorise.bind(this)();
		this.login = factory.login.bind(this)();

		this.app.add_shutdown_task(this.login.popup_close)
	}

	req_authorise = () => this.auth.req_authorise()
	authorised = (success: boolean) => this.auth.authorised.bind(this)(success);
	login_backend = () => this.login.login_backend();

	get_accounts() {
		return this.messenger.request<"backend", boolean>("req_accounts")
			.then(() => console.info("Got Saxo accounts"))
	}
	get_positions() {
		return this.messenger.request<"backend", boolean>("req_positions")
			.then(() => console.info("Got Saxo positions"))
	}

	protected auth: authorise_f
	protected login: login_f

	protected messenger: Messenger;
}


