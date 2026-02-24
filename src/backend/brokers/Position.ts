import type { ibkr_t, saxo_t } from "../../types";

export class Position {
	constructor(
		private position: saxo_t.position_t | ibkr_t.position_t,
		private broker: broker_t
	) { }
	map = () => {
		if (this.broker === "saxo") {
			const p = this.position as saxo_t.position_t;
			return {
				id: p.PositionId,
				broker: this.broker,
				account_id: "???",
				description: p.DisplayAndFormat.Description,
				ticker: p.DisplayAndFormat.Symbol,
				currency: p.DisplayAndFormat.Currency as currency_t
			} as position_t
		} else {
			const p = this.position as ibkr_t.position_t;
			return {
				id: p.conid.toString(),
				broker: this.broker,
				account_id: p.acctId,
				description: p.fullName,
				ticker: p.name,
				currency: p.currency as currency_t
			} as position_t
		}
	}
}
