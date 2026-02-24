import * as conf from "../../../conf.json";
import { Messenger } from "../../Messenger"
import { Ws, type action_t, type respond_t } from "../../Ws";

import type { Api, App } from "..";
import type { saxo_t, message_t, topic_t, data_t } from "../../types";


export class ServerWs extends Ws {

	constructor(private app: App) {
		super()
		this.api = this.app.api;
		this.ws = this.make_ws_server();
	}

	private respond(mssg: message_t, p: req_t) {
		const _mssg = mssg as unknown as message_t<"backend">;
		switch (_mssg.topic) {
			case "req_is_authorised":
				const broker = mssg.data as broker_t;
				this.api.req_is_authorised(p, broker);
				break;
			case "req_saxo_authorise":
				const auth_code = mssg.data as saxo_t.auth_code_t;
				this.api.req_saxo_authorise(p, auth_code);
				break;
			case "req_saxo_auth_url":
				this.api.req_saxo_auth_url(p)
				break
			case "req_accounts":
				this.api.req_accounts(p)
				break;
			case "req_positions":
				this.api.req_positions(p)
				break;
		}
	}
	private action(mssg: message_t) {
		const _mssg = mssg as unknown as message_t<"backend">;
		switch (_mssg.topic) { }
	}

	publish(
		topic: topic_t<"frontend">,
		data?: data_t,
		params?: string[]
	) {
		const mess = Messenger.encode(topic, data || "", undefined, undefined, params);
		this.ws.publish(topic, mess)
	}

	private router(ws: ws_t, data: string) {
		const mssg = Messenger.decode(data);
		const messenger = this.messengers.get(ws)!;
		const requests = messenger.requests;

		//console.log(mssg)
		const { req_uid, res_uid } = mssg

		if (!req_uid && !res_uid) return this.action(mssg);
		if (res_uid) return this.resolve_response(requests, mssg);
		if (req_uid) this.respond(mssg, { messenger, req_uid })
	}


	private ws_actions: Bun.WebSocketHandler<undefined> = {
		message: (ws, message) => { this.router(ws, message.toString()) },
		open: (ws) => {
			const messenger = new Messenger(ws);
			this.messengers.set(ws, messenger)

			!!this.target_topics ?
				this.subscribe_all(ws) :
				this.request_frontend_topics(ws, messenger)
		},
		close: (ws, _code, _message) => {
			this.messengers.delete(ws)
		},
		drain(_ws) { }, // the socket is ready to receive more data
	}

	private make_ws_server() {
		return Bun.serve({
			port: conf.ws_port,
			fetch(req, server) {
				if (server.upgrade(req)) return;
				return new Response("Upgrade failed", { status: 500 });
			},
			websocket: this.ws_actions
		})
	}
	private request_frontend_topics(ws: Bun.ServerWebSocket, messenger: Messenger) {
		messenger.request<"frontend", topic_t<"frontend">[]>("req_topics")
			.then((message) => {
				this.target_topics = message.data;
				this.subscribe_all(ws);
			})
	}
	private subscribe_all(ws: Bun.ServerWebSocket) {
		this.target_topics?.forEach(topic => {
			ws.subscribe(topic);
		})
	}


	private ws: ReturnType<typeof this.make_ws_server>;
	private target_topics?: topic_t<"frontend">[];
	private messengers = new Map<ws_t, Messenger>;
	private api: Api

}





