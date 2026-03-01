import { Account, Position } from "./brokers";
import type { ibkr_t, saxo_t } from "../types";


type native_position_t = saxo_t.position_t | ibkr_t.position_t
type native_account_t = saxo_t.account_t | ibkr_t.account_t


export class Cache {
	get ibkr_accounts() {
		return this._ibkr_accounts.size ? [...this._ibkr_accounts.values()] : undefined
	}
	get accounts() {
		const size = this._ibkr_accounts.size + this._saxo_accounts.size;
		return size ? [...this._ibkr_accounts.values(), ...this._saxo_accounts.values()] : undefined
	}
	get positions() {
		return this._positions.size ? [...this._positions.values()] : undefined
	}
	add = {
		account: (
			native_account: native_account_t,
			broker: broker_t
		) => {
			const account = new Account(native_account, broker).map();
			const { original_id } = account;
			if (account.broker === "saxo") this._saxo_accounts.set(original_id, account)
			if (account.broker === "ibkr") this._ibkr_accounts.set(original_id, account)
		},
		position: (
			native_position: native_position_t,
			broker: broker_t
		) => {
			const position = new Position(native_position, broker).map();
			this._positions.set(position.id, position);
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
	private _saxo_accounts = new Map<string, account_t>();
	private _ibkr_accounts = new Map<string, account_t>();
	private _positions = new Map<string, position_t>();

}
