export type { Api } from "./Api.ts";
export type { App } from "./App.ts";
export type { Cache } from "./Cache.ts"
export type { Messenger } from "../Messenger.ts";

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







