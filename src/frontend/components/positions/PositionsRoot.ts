import { Brokers } from "../../brokers";
import { AppElement } from "../AppElement";
import { Util } from "../../../Util"


export class PositionsRoot extends AppElement {
	static observedAttributes = ["ready", "state"];

	constructor() {
		super()
		this.set_topic(this)

		this.app = window.app;
		this.cache = this.app.cache;
		this.ticker = this.getAttribute("ticker")!

		this.set_html_height()
		this.setAttribute("state", "closed");
		this.watch("state", this.open_close)

	}
	connectedCallback() {
		this.render()
	}

	private render() {
		this.thead.appendChild(this.make_element("tr", this.headers_html))
		this.body_children.forEach(child => this.tbody.appendChild(child))
		this.appendChild(this.table)

	}
	private get headers_html() {
		return Brokers.positions_headers.map(name => {
			return `<th name=${name}>${Util.Title_Case(name)}</th>`
		}, []).join("")
	}
	private get body_children() {
		const positions = this.cache!.positions.filter(p => p.ticker === this.ticker)
		return positions?.map(position => {
			return this.make_element("position-row", "", `id=${position.id}`)
		})
	}
	private open_close = (old_value: string, new_value: string) => {
		if (old_value === new_value) return;
		this.set_html_height()
		this.setAttribute("state", new_value)
	}

	private set_html_height() {
		this.setAttribute("style", `height:${this.scrollHeight}px`);
	}
	private ticker: string
}


