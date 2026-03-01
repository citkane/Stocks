import type { Saxo } from "."
import type { saxo_t } from "../../../types"

const endpoints = {
	accounts: () => "accounts"
}

export function accounts(this: Saxo) {
	return {
		get_accounts: get_accounts.bind(this),
	}
}

function get_accounts(this: Saxo): Promise<boolean> {
	return this.fetch(endpoints.accounts())
		.then(res => res.json())
		.then((data: saxo_t.accounts_t) => {
			console.json("SAXO accounts", data)
			this.cache.add.accounts(data.Data, "saxo")
			return true
		})
		.catch(err => {
			console.error(err);
			throw err;
		})
}
