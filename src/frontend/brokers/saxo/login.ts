import type { Saxo } from ".";
import type { saxo_t } from "../../../types";

let login_window: window_t;
window.addEventListener("focus", () => login_window?.focus())


export function login(this: Saxo) {
	return {
		popup_login: popup_login,
		login_backend: login_backend.bind(this),
		popup_close,
		go_back
	}
}

function popup_login(url: string) {
	const windowFeatures = "popup,innerWidth=1600,innerHeight=1900";
	login_window = window.open(url, "saxoWindow", windowFeatures);
	login_window?.resizeTo(600, 900)
}
function popup_close() {
	login_window?.close();
	window.focus();
}

function go_back() {
	login_window?.history.back();
}

function login_backend(this: Saxo) {
	const auth_code = parse_code_from_url();
	this.messenger.request<"backend", boolean>("req_saxo_authorise", auth_code)
		.then(messg => messg.data ? popup_close() : go_back())
		.catch(go_back)
}

function parse_code_from_url() {
	const url = new URL(window.location.href);
	const params = Object.fromEntries(url.searchParams);
	return params as saxo_t.auth_code_t
}
