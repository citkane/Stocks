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
		if (this.broker === "saxo") {
			const a = this.account as saxo_t.account_t;
			return {
				id: a.AccountId,
				broker: "saxo",
				alias: "alias",
				currency: a.Currency
			} as account_t
		} else {
			const p = this.account as ibkr_t.account_t;
			return {

			} as account_t
		}
	}
}
