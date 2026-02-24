import type { ibkr_t, saxo_t } from "../../types";

export class Position {
	constructor(
		private position: saxo_t.position_t | ibkr_t.position_t,
		private broker: broker_t
	) { }
	map = () => {
		let p: saxo_t.position_t | ibkr_t.position_t
		let position: position_t
		switch (this.broker) {
			case "saxo":
				p = this.position as saxo_t.position_t;
				position = {
					id: `${this.broker}_${p.PositionId}`,
					broker: this.broker,
					account_id: "???",
					description: p.DisplayAndFormat.Description,
					ticker: p.DisplayAndFormat.Symbol,
					currency: p.DisplayAndFormat.Currency as currency_t
				} as position_t
				break;
			case "ibkr":
				p = this.position as ibkr_t.position_t;
				position = {
					id: `${this.broker}_${p.conid}`,
					broker: this.broker,
					account_id: p.acctId,
					description: p.fullName,
					ticker: p.name,
					currency: p.currency as currency_t
				} as position_t
				break;
			default:
				position = {} as position_t
		}
		return position;
	}
}
