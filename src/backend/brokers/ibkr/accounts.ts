import type { Ibkr } from "."
import type { ibkr_t } from "../../../types"

const endpoints = {
	accounts: () => "portfolio/accounts"
}

export function accounts(this: Ibkr) {
	return {
		get_accounts: (): Promise<boolean> => {
			return this.fetch(endpoints.accounts())
				.then(res => res.json())
				.then((accounts: ibkr_t.accounts_t) => {
					this.cache.add.accounts(accounts, "ibkr")
					return true
				})
				.catch(err => {
					console.error(err);
					throw err;
				})
		},
	}
}
