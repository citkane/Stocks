import type { Ibkr } from "."
import type { ibkr_t } from "../../../types"

const keep_alive_time = 60000
let staying_alive = false;

const endpoints = {
	status: "iserver/auth/status",
	tickle: "tickle"
}

export function authorise(this: Ibkr) {
	return {
		is_authenticated: is_authenticated.bind(this),
		poll_authenticated: poll_authenticated.bind(this),
	}
}

function is_authenticated(this: Ibkr) {
	return this.fetch(endpoints.tickle)
		.then(res => res.json())
		.then((tickle: ibkr_t.tickle_t) => tickle.iserver.authStatus)
		.then(status => status.authenticated)
		.catch(_err => false)
}
//function get_authenticated(this: Ibkr) {
//	return this.fetch(endpoints.status)
//		.then(res => res.json())
//		.then((status: ibkr_t.status_t) => status.authenticated)
//		.catch(_err => false)
//}
function keep_alive(this: Ibkr) {
	staying_alive = true;
	is_authenticated.bind(this)()
		.then(success => {
			if (!success) return staying_alive = false;
			setTimeout(() => { keep_alive.bind(this)() }, keep_alive_time)
		})
}
async function poll_authenticated(this: Ibkr): Promise<boolean> {
	return is_authenticated.bind(this)().then(success => {
		if (!success) return poll_authenticated.bind(this)();
		if (!staying_alive) keep_alive.bind(this);
		return Promise.resolve(true)
	});
}




