import { Brokers } from "../../brokers";
import { AppElement } from "../AppElement";
import { Util } from "../../../Util"


export class AccountsRoot extends AppElement {
	static observedAttributes = ["ready"];

	constructor() {
		super()
		this.set_topic(this)
		this.ready().then(this.render)
	}

	private render = () => {
		this.thead.appendChild(this.make_element("tr", this.headers_html))
		this.body_children?.forEach(child => this.tbody.appendChild(child))

		this.appendChild(this.table)
	}

	private get headers_html() {
		return Brokers.account_headers.map(name => {
			return `<th name="${name}">${Util.Title_Case(name)}</th>`
		}, []).join("")
	}
	private get body_children() {
		return this.cache?.accounts.map(account => {
			return this.make_element("account-row", "", `id="${account.id}"`)
		})
	}
}


