import { ibkr as conf } from "../../../../conf.json"
import type { Ibkr } from ".";
import { Brokers } from "../Brokers";

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
	return this.messenger.request<"backend", boolean>("is_authorised", "ibkr")
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
	if (!resolve_login) return;
	window.focus();
	popup_close();
	resolve_login(true);
}

function popup_login(url: string) {
	login_window = Brokers.popup_login(url, "IBKR")
}
function popup_close() {
	login_window?.close();
	window.focus();
}


