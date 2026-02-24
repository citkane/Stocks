import { ibkr as conf } from "../../../../conf.json"
import type { Ibkr } from ".";

let resolve_login: resolve_t;
let login_window: ReturnType<typeof window.open>;
window.addEventListener("focus", () => login_window?.focus());

export function login(this: Ibkr) {
	return {
		got_login,
		popup_close,
		await_login: await_login.bind(this),
	}
}

function is_authorised(this: Ibkr) {
	return this.messenger.request<"backend", boolean>("req_is_authorised", "ibkr")
		.then(mssg => mssg.data)
}

async function await_login(this: Ibkr): Promise<boolean> {
	if (await is_authorised.bind(this)()) return Promise.resolve(true);
	return new Promise(async (resolve, _reject) => {
		resolve_login = resolve;
		popup_login(conf.url.base);
	})
}
function got_login() {
	popup_close();
	resolve_login(true);
}

function popup_login(url: string) {
	const windowFeatures = "popup,innerWidth=1600,innerHeight=1900";
	login_window = window.open(url, "ibkrWindow", windowFeatures);
	login_window?.resizeTo(600, 900)
}
function popup_close() {
	login_window?.close();
	window.focus();
}


