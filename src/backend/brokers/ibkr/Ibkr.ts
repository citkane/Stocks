import { Fetch, factory, type authorise_f, type accounts_f } from "."
import { Cache } from "../"

import type { App } from "../..";
import type { ServerWs } from "../../servers";

export class Ibkr extends Fetch {

	constructor(private app: App) {
		super();

		this.authorise = factory.authorise.bind(this)();
		this.accounts = factory.accounts.bind(this)();
		this.cache = this.app.cache;
		this.ws = this.app.ws

		this.authorise.poll_authenticated()
			.then(() => this.ws.publish("authorised", true, ["ibkr"]))
		//this.app.add_shutdown_fnc(this.authorise.logout)
	}

	//wait_authorised = () => this.authorise.wait_authorised();
	is_authorised = () => this.authorise.is_authorised();

	public accounts: accounts_f

	protected authorise: authorise_f
	protected cache: Cache;
	private ws: ServerWs;
}
/*
init() {
	return new Promise(resolve => {
		this.get_status()
			.then(status => {
				if (status?.authenticated) return resolve(true);
				this.connect();
			})
			.catch(err => this.connect())
	})
}

get_accounts(): Promise<ibkr_t.account_t[]> {
	return this.fetch(this.endpoints.accounts())
		.then(res => {
			if (!res.ok) throw Error(`${res.status} ${res.statusText}`)
			return res.json();
		})
}
get_positions(account_id: string): Promise<ibkr_t.position_t[]> {
	return this.fetch(this.endpoints.positions(account_id))
		.then(res => res.json())
		.then(json => {
			const _json = json as unknown as ibkr_t.position_t[];
			return _json.map(position => {
				position.acctId = account_id;
				return position;
			}, [])
		})
}

get_position(account_id: string, con_id: number): Promise<ibkr_t.position_t> {
	return this.fetch(this.endpoints.position(account_id, con_id))
		.then(res => res.json())
		.then(json => json as unknown as [any])
		.then(json => json[0])
}

async parse_accounts_to_positions(accounts: ibkr_t.account_t[]) {
	this.parsed_positions = [];
	return new Promise<ibkr_t.position_t[]>(resolve => {
		accounts.forEach((account, i) => this.parse_account(account, i, resolve))
	})
}
private async parse_account(account: ibkr_t.account_t, i_a: number, resolve: Function) {
	const acc_positions = await this.get_positions(account.id);
	acc_positions.forEach((position, i_p) => {
		position.acctId = account.id;
		this.parse_position(position, i_a, i_p, resolve)
	})
}
private async parse_position(position: ibkr_t.position_t, i_a: number, i_p: number, resolve: Function) {
	position = await this.get_position(position.acctId, position.conid);
	this.parsed_positions.push(position)
	if (!i_a && !i_p) resolve(this.parsed_positions);
}

*/



/*
async function get_session_token(): Promise<oauth_t> {
	const req = new Request(url.tickle, { method: "POST" });
	return fetch(req, tls_params)
		.then(res => res.json() as unknown as oauth_t)
		.then(data => { return { session: data.session } })
		.catch(err => { throw (err) });
}

async function connect_websocket_client() {
	return get_session_token()
		.then(token => { return { cookie: `api=${JSON.stringify(token)}` } })
		.then(token => {
			const params = { ...tls_params, headers: { ...token } };
			socket = new WebSocket(url.ws, params)
		})
		.catch(err => { throw (err) });

}

function on_message(buffer: Buffer) {
	const message = JSON.parse(buffer.toString()) as message_t;
	console.log(message.topic);
	switch (message.topic) {
		case "act":
			on_account(message.args!)
			break;
	}
}

function on_account(args: args_t) {
	const { aliases } = args;
	if (!aliases) return;
	Object.keys(aliases).forEach(account => {
		if (account === "All") return;
		get_positions(account)
			.then(positions => console.log(aliases[account], positions))
	})
}

connect_websocket_client().then(() => {
	socket.addEventListener("open", (e) => console.log("Websocket Open"))
	socket.addEventListener("close", (e) => console.log("Websocket Closed"))
	socket.addEventListener("error", (e) => { throw (e) })
	socket.addEventListener("message", message => on_message(message.data))
}).catch(err => { throw (err) });


const req = {
	accounts: new Request(`${url.api}/iserver/accounts`),
	tickle: new Request(url.tickle, { method: "POST" })
}
*/
