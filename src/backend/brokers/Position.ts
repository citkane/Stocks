import type { ibkr_t, saxo_t } from "../../types";
import { Util } from "../../Util"

type exchanges_t = keyof typeof exchanges;
const exchanges = {
	"SEHKNTL": "sse",
	"SEHKSZSE": "she",
	"xssc": "sse",
	"xdub": "dub",
	"xhkg": "hkse",
	"xsec": "she",
	"xetr": "etr",
	"xswx": "swx",
	"xjse": "jse",
	"xams": "ams",
	"xmil": "mil",
	"IBIS": "ibis",
	"FWB2": "fwb2",
	"IBIS2": "ibis2",
	"BVME.ETF": "bvme",
	"SEHK": "hkse",
}

export class Position {
	constructor(
		private position: saxo_t.position_t | ibkr_t.position_t,
		private broker: broker_t
	) { }
	private hkse_padded(ticker: string) {
		return ticker.length < 4 ? ticker!.padStart(4, "0") : ticker
	}
	private saxo_details(p: saxo_t.position_t) {
		const description = Util.Title_Case(p.DisplayAndFormat.Description)
		let [ticker, exchange] = p.DisplayAndFormat.Symbol.split(":")
		exchange = exchanges[exchange! as exchanges_t] || exchange as exchanges_t
		if (exchange === "hkse") ticker = this.hkse_padded(ticker!)
		return { ticker, exchange, description }
	}
	private ibkr_details(p: ibkr_t.position_t) {
		const description = p.name ? Util.Title_Case(p.name) : undefined
		const exchange = exchanges[p.listingExchange! as exchanges_t] || p.listingExchange
		let ticker = p.ticker
		if (!!ticker && exchange === "hkse") ticker = this.hkse_padded(ticker!)
		return { ticker, exchange, description }
	}

	map = () => {
		let p: saxo_t.position_t | ibkr_t.position_t
		let position: position_t

		switch (this.broker) {
			case "saxo":
				p = this.position as saxo_t.position_t;
				const saxo_d = this.saxo_details(p)
				position = {
					id: `${this.broker}_${p.PositionId}`,
					original_id: p.PositionId,
					broker: this.broker,
					account_id: "???",
					description: saxo_d.description,
					ticker: saxo_d.ticker,
					currency: p.DisplayAndFormat.Currency as currency_t,
					exchange: saxo_d.exchange
				} as position_t
				break;
			case "ibkr":
				p = this.position as ibkr_t.position_t;
				const ibkr_d = this.ibkr_details(p)

				position = {
					id: `${this.broker}_${p.conid}`,
					original_id: p.conid?.toString(),
					broker: this.broker,
					account_id: p.acctId,
					description: ibkr_d.description,
					ticker: ibkr_d.ticker,
					currency: p.currency as currency_t,
					exchange: ibkr_d.exchange
				} as position_t
				break;
			default:
				position = {} as position_t
		}

		return position;
	}
}
