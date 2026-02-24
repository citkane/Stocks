import { Account, Position } from ".";
import type { ibkr_t, saxo_t } from "../../types";
import type { App } from "..";
import type { ServerWs } from "../servers";


type native_position_t = saxo_t.position_t | ibkr_t.position_t
type native_account_t = saxo_t.account_t | ibkr_t.account_t


export class Cache {
	constructor(app: App) {
		this.ws = app.ws;
	}

	get accounts() {
		return this._accounts;
	}
	get positions() {
		return this._positions.entries().map(entry => {
			const [_id, position] = entry;
			return position;
		});
	}
	add = {
		account: (
			native_account: native_account_t,
			broker: broker_t
		) => {
			const account = new Account(native_account, broker).map();
			this._accounts.set(account.id, account);
			this.ws.publish("account", account, [broker]);
		},
		position: (
			native_position: native_position_t,
			broker: broker_t
		) => {
			const position = new Position(native_position, broker).map();
			this._positions.set(position.id, position);
			this.ws.publish("position", position, [broker]);
		},
		accounts: (
			native_accounts: native_account_t[],
			broker: broker_t
		) => {
			native_accounts.forEach(account => this.add.account(account, broker))
		},
		positions: (
			native_positions: native_position_t[],
			broker: broker_t
		) => {
			native_positions.forEach(native_position => this.add.position(native_position, broker))
		},

	}
	private _accounts = new Map<string, account_t>();
	private _positions = new Map<string, position_t>();
	private ws: ServerWs;

}
