import type { Ibkr } from "."
import type { ibkr_t } from "../../../types"

const page_limit = 100

const endpoints = {
	positions: (account_id: string, page: number) => `portfolio/${account_id}/positions/${page}?waitForSecDef=true`,
	positions_invalidate_cache: (account_id: string) => `portfolio/${account_id}/positions/invalidate`,
	position: (account_id: string, con_id: string) => `portfolio/${account_id}/position/${con_id}`
}

export function positions(this: Ibkr) {
	return {
		get_positions: get_positions.bind(this),
		get_position: get_position.bind(this)
	}
}
function get_position(this: Ibkr, account_id: string, con_id: string) {
	const endpoint = endpoints.position(account_id, con_id);
	return this.fetch(endpoint)
		.then(res => res.json())
		.then((position: ibkr_t.position_t) => {
			this.cache.add.position(position, "ibkr");
			console.json("IBKR position", position)
			return true
		})
		.catch(err => {
			console.error(err);
			throw err;
		})
}
function get_positions(this: Ibkr, account_id: string, page = 0): Promise<boolean> {
	const endpoint = endpoints.positions(account_id, page);
	return this.fetch(endpoint)
		.then(res => res.json())
		.then((positions: ibkr_t.positions_t) => {
			this.cache.add.positions(positions, "ibkr");
			if (positions.length >= page_limit) {
				page++
				return get_positions.bind(this)(account_id, page)
			}
			console.json("IBKR positions", positions)
			return true
		})
		.catch(err => {
			console.error(err);
			throw err;
		})
}
