import * as conf from "../../../conf.json";
import { Messenger } from "../../Messenger"
import { Ws } from "../../Ws";

import type { Api, App } from ".."
import { blank_resolver, type message_t } from "../../types";


export class ClientWs extends Ws {
	constructor(private app: App) {
		super()
		this.api = this.app.api;
		const ws = new WebSocket(`ws://0.0.0:${conf.ws_port}`);
		this.messenger = new Messenger(ws);

		ws.addEventListener("message", event => this.router(event.data));
		ws.addEventListener("open", (event) => this.is_connected.resolve(event));
		ws.addEventListener("close", _event => { });
		ws.addEventListener("error", event => this.is_connected.reject(event));
	}
	private respond(mssg: message_t, p: req_t) {
		const _mssg = mssg as unknown as message_t<"frontend">;
		switch (_mssg.topic) {
			case "req_topics":
				this.api.req_topics(p);
				break;
		}
	}
	private action(mssg: message_t) {
		const _mssg = mssg as unknown as message_t<"frontend">;
		switch (_mssg.topic) {
			case "authorised":
				const success = mssg.data as boolean;
				const broker = mssg.params![0] as broker_t
				this.api.authorised(success, broker)
				break;
			case "shutdown":
				this.api.shutdown();
				break
			case "position":
				const position = mssg.data as position_t;
				this.api.position(position)
				break;
			case "account":
				const account = mssg.data as account_t;
				this.api.account(account)
				break;
		}
	}

	public connected() {
		return new Promise((resolve, reject) => {
			this.is_connected = { resolve, reject }
		})
	}
	private router(data: string) {
		const mssg = Messenger.decode(data);

		const { req_uid, res_uid } = mssg
		const messenger = this.messenger;
		const { requests } = messenger;

		if (!req_uid && !res_uid) return this.action(mssg);
		if (res_uid) return this.resolve_response(requests, mssg);
		if (req_uid) this.respond(mssg, { messenger, req_uid })
	}


	public messenger: Messenger;
	private is_connected = blank_resolver();
	private api: Api
}
