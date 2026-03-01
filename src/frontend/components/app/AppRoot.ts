import { AppElement } from "../AppElement";

export class AppRoot extends AppElement {
	static observedAttributes = ["ready"];

	constructor() {
		super()
		this.set_topic(this);
	}
	connectedCallback() {
		this.ready().then(this.init)
	}

	private init = () => {
		const accounts = document.getElementsByTagName("accounts-root")[0];
		const stocks = document.getElementsByTagName("stocks-root")[0];

		accounts?.setAttribute("ready", "true")
		stocks?.setAttribute("ready", "true")
	}
}

