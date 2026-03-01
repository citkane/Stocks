import { Fetch, factory, type authorise_f, type accounts_f, type positions_f } from "."

import type { App, Cache } from "../..";
import type { ServerWs } from "../../servers";

export class Ibkr extends Fetch {

	constructor(private app: App) {
		super();

		this.authorise = factory.authorise.bind(this)();
		this.accounts = factory.accounts.bind(this)();
		this.positions = factory.positions.bind(this)();

		this.cache = this.app.cache;
		this.ws = this.app.ws

		this.authorise.poll_authenticated()
			.then(() => this.ws.publish("authorised", true, ["ibkr"]))
	}

	is_authorised = () => this.authorise.is_authenticated()
	get_positions = async () => {
		//if (this.cache.positions && this.cache.positions.length > 0) return Promise.resolve(true)
		await this.accounts.get_accounts();
		await Promise.all(this.cache.ibkr_accounts!.map((account) => {
			return this.positions.get_positions(account.original_id)
		}))

		const invalid_positions = this.cache.positions?.filter(position => !position.description) || [];
		invalid_positions.length && console.warn("Invalid positions", invalid_positions.length)
		return Promise.all(invalid_positions.map(position => {
			return this.positions.get_position(position.account_id, position.original_id)
		}))
	}


	public accounts: accounts_f
	protected positions: positions_f

	protected authorise: authorise_f
	protected cache: Cache;
	private ws: ServerWs;
}

