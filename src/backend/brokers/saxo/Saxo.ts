
import { Fetch, factory, type accounts_f, type authorise_f, type positions_f, type outh_f } from "."
import { Cache } from "../"

import type { App } from "../.."
import type { ServerWs } from "../../servers"

export class Saxo extends Fetch {

	constructor(private app: App) {
		super()
		this.ws = this.app.ws;
		this.cache = this.app.cache;
		this.authorise = factory.authorise.bind(this)(this.app.http.url);
		this.oauth = factory.oauth.bind(this)(this.app.http.url)
		this.positions = factory.positions.bind(this)();
		this.accounts = factory.accounts.bind(this)();

		this.fetch = this.fetch.bind(this);
	}

	is_authorised = () => this.authorise.is_authorised();
	get_code_url = () => this.authorise.get_code_url();
	get_token = (code: string) => this.oauth.get_token(code);


	public positions: positions_f
	public accounts: accounts_f
	protected authorise: authorise_f
	protected oauth: outh_f


	protected cache: Cache;
	protected ws: ServerWs;
	protected keepalive?: ReturnType<typeof setInterval>

}
