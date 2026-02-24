export class Cache {
	add = {
		position: (position: position_t) => {
			const { id, broker } = position;
			const uid = `${broker}_${id}`
			this.positions.set(uid, position);
		},
		account: (account: account_t) => {
			const { id, broker } = account;
			const uid = `${broker}_${id}`
			this.accounts.set(uid, account)
		}
	}
	private accounts = new Map<string, account_t>()
	private positions = new Map<string, position_t>()
}
