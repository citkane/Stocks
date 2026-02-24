import type { Ibkr } from "."
import type { ibkr_t } from "../../../types"

let authenticated = false;
const endpoints = {
	status: "iserver/auth/status",
	logout: "logout"
}

export function authorise(this: Ibkr) {
	return {
		is_authorised,
		poll_authenticated: poll_authenticated.bind(this),
		logout: logout.bind(this)
	}
}
function is_authorised() { return Promise.resolve(authenticated) }
function get_authenticated(this: Ibkr) {
	return this.fetch(endpoints.status)
		.then(res => res.json())
		.then((status: ibkr_t.status_t) => status.authenticated)
		.catch(_err => false)
}

function poll_authenticated(this: Ibkr): Promise<boolean> {
	if (authenticated) return Promise.resolve(true);
	return get_authenticated.bind(this)().then(success => {
		if (authenticated) { }
		authenticated = success;
		return success ?
			Promise.resolve(true) :
			poll_authenticated.bind(this)();
	});
}

function logout(this: Ibkr) {
	return this.fetch(endpoints.logout)
}



