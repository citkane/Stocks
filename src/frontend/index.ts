export type { Api } from "./Api";
export type { App } from "./App";
export type { Cache } from "./Cache"
export type { Messenger } from "../Messenger";
export type { Events, event_data_t, component_key_t } from "./Events.ts"

import "./components"
import { Router } from './servers'
import { App } from "./App.ts";


const app = new App()

try {
	await app.ws.connected();
	console.info("WebSocket connected")
} catch (err) {
	console.info("WebSocket connection failed")
	console.error(err);
}

new Router(app);







