import * as conf from "../../../conf.json";
import { Messenger } from "../../Messenger"
import { Ws } from "../../Ws";

import type { Api, App } from ".."
import { blank_resolver } from "../../types";


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

	public connected() {
		return new Promise((resolve, reject) => {
			this.is_connected = { resolve, reject }
		})
	}

	private router(data: string) {
		const mssg = Messenger.decode(data);

		const messenger = this.messenger;
		const { requests } = messenger;

		this.route(this.api, requests, messenger, mssg);

	}

	public messenger: Messenger;
	private is_connected = blank_resolver();
	private api: Api
}

