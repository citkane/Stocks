import { randomUUIDv7 } from "bun";
import * as conf from "../../../../conf.json"

import type { Saxo } from ".";

let base_uri: string;
let redirect: string;
let endpoint = "authorize"

export function authorise(this: Saxo, _base_uri: string) {
	base_uri = _base_uri;
	redirect = `${base_uri}${conf.saxo.url.redirect.code}`
	endpoint = `${endpoint}?${make_code_params()}`

	return {
		is_authorised: is_authorised.bind(this),
		get_code_url: get_code_url.bind(this),
	}
}


function make_code_params(): string {
	return [
		"response_type=code",
		`client_id=${conf.saxo.app_key}`,
		`state=${randomUUIDv7("base64url", Date.now())}`,
		`redirect_uri=${encodeURI(redirect)}`
	].join("&")
}


async function is_authorised(this: Saxo): Promise<boolean> {
	try {
		const token = await this.oauth.read_token();
		if (!token) return false;
		const is_valid = await this.oauth.refresh_token(token.refresh_token);
		return is_valid;
	} catch (err) {
		throw err;
	}
}

async function get_code_url(this: Saxo): Promise<string> {
	const base_url = conf.saxo.url.auth;
	return this.fetch(endpoint, base_url)
		.then(res => res.url)
}


