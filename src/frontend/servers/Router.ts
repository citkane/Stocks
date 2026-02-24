import type { App } from ".."
import type { Brokers } from "../brokers"
import * as conf from "../../../conf.json"

export class Router {
	constructor(private app: App) {
		this.brokers = app.brokers;

		window.addEventListener("hashchange", this.route)
		window.addEventListener("popstate", this.route)
		this.route();
	}

	private async route() {
		const url = new URL(window.location.href);
		const { pathname } = url;
		switch (pathname) {
			case "/":
				this.app.run();
				break;
			case `/${conf.saxo.url.redirect.code}`:
				this.brokers.login("saxo");
				break;
		}
	}

	private brokers: Brokers
}


