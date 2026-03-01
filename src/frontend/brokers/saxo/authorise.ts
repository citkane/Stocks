import { blank_resolver } from "../../../types";
//import * as conf from "../../../../conf.json"

import type { Saxo } from "."

//const is_login_context = window.location.pathname.endsWith(conf.saxo.url.redirect.code);


export function authorise(this: Saxo) {
	return {
		req_authorise: req_authorise.bind(this),
		authorised: authorised.bind(this)
	}
}

let resolver = blank_resolver();

async function req_authorise(this: Saxo): Promise<boolean> {
	try {
		const authorised = await is_backend_authorised.bind(this)();
		if (authorised) return true
		const login_url = await req_login_url.bind(this)();
		this.login.popup_login(login_url)
		return new Promise<boolean>((resolve, reject) => {
			resolver = { resolve, reject }
		})
	} catch (err) {
		console.error(err);
		return false
	}
}
function authorised(this: Saxo, success: boolean) {
	if (success) {
		this.login.popup_close();
		resolver.resolve(true);
	} else {
		this.login.go_back();
		resolver.reject(false);
	}
}

function req_login_url(this: Saxo): Promise<string> {
	return this.messenger.request<"backend", string>("saxo_auth_url")
		.then(mssg => mssg.data)
}

function is_backend_authorised(this: Saxo) {
	return this.messenger.request<"backend", boolean>("is_authorised", "saxo")
		.then(mssg => mssg.data)
}


