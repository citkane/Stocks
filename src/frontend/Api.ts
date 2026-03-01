import type { App } from ".";
import type { Brokers } from "./brokers"


export class Api implements Api_t {
	request = {
		topics: (p: req_t) => p.messenger.response(p.req_uid, this.app.set_topics)
	};
	set = {
		authorised: (success: boolean, broker: broker_t) => this.brokers.authorised(success, broker),
		position: (position: position_t) => this.brokers.position(position),
		account: (account: account_t) => this.brokers.account(account),
		shutdown: () => window.close(),
	};

	init(app: App) {
		this.app = app;
		this.brokers = app.brokers;
	}

	private brokers!: Brokers
	private app!: App

}

export type topic_set_t = keyof InstanceType<typeof Api>["set"];
export type topic_req_t = keyof InstanceType<typeof Api>["request"];


