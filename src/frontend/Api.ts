import type { App } from ".";
import type { Brokers } from "./brokers"


export class Api {
	init(app: App) {
		this.app = app;
		this.brokers = app.brokers;
	}

	req_topics = (p: req_t) => p.messenger.response(p.req_uid, this.app.topics);
	authorised = (success: boolean, broker: broker_t) => this.brokers.authorised(success, broker);
	shutdown = () => window.close();

	position = (position: position_t) => this.brokers.position(position);
	account = (account: account_t) => this.brokers.account(account);


	private brokers!: Brokers
	private app!: App

}

export type topic_t = keyof InstanceType<typeof Api>;

