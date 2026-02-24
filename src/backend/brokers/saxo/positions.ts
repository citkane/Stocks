import { saxo } from "../../../../conf.json"
import type { Saxo } from ".."
import type { saxo_t } from "../../../types"

const paging_top = 100;
const endpoints = {
	positions: (skip: number) => `positions?ClientKey=${saxo.client_key}&fieldGroups=DisplayAndFormat&$top=${paging_top}&$skip=${skip}`,
	position: (id: string, client_key: string) => `positions/${id}?ClientKey=${client_key}`
}

export function positions(this: Saxo) {
	return {
		get_positions: (skip = 0): Promise<boolean> => {
			return this.fetch(endpoints.positions(skip))
				.then(res => res.json())
				.then((data: saxo_t.positions_t) => {
					this.cache.add.positions(data.Data, "saxo");
					if (data["__next"]) {
						skip = skip + paging_top
						return this.pos.get_positions(skip)
					}
					return true
				})
				.catch(err => {
					console.error(err);
					throw err;
				})
		}
	}
}
