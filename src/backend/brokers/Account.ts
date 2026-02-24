import type { ibkr_t, saxo_t } from "../../types";

type account_t = {
	id: string;
	broker: broker_t;
	alias: string;
	currency: currency_t
}

export class Account {
	constructor(
		private account: saxo_t.account_t | ibkr_t.account_t,
		private broker: broker_t
	) { }

	map = () => {
		let a: saxo_t.account_t | ibkr_t.account_t
		let account: account_t
		switch (this.broker) {
			case "saxo":
				a = this.account as saxo_t.account_t;
				account = {
					id: `${this.broker}_${a.AccountId}`,
					broker: this.broker,
					alias: "???",
					currency: a.Currency
				} as account_t
				break;
			case "ibkr":
				a = this.account as ibkr_t.account_t;
				account = {
					id: `${this.broker}_${a.accountId}`,
					broker: this.broker,
					alias: a.accountAlias,
					currency: a.accountVan || a.currency
				} as account_t
				break;
			default:
				account = {} as account_t
		}
		return account;
	}
}
