export class Cache {
	add = {
		position: (position: position_t) => {
			const { id } = position;
			this.positions.set(id, position);
		},
		account: (account: account_t) => {
			const { id } = account;
			this.accounts.set(id, account)
		}
	}
	private accounts = new Map<string, account_t>()
	private positions = new Map<string, position_t>()
}
