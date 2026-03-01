import * as conf from "../../../../conf.json"

import type { Saxo } from "."
import type { saxo_t } from "../../../types";

const endpoint = "token"
const token_file = `.temp/saxo.token.json`;
const keepalive_interval = 1190000;
let base_uri: string;
let redirect: string;

export function oauth(this: Saxo, _base_uri: string) {
	base_uri = _base_uri;
	redirect = `${base_uri}${conf.saxo.url.redirect.token}`;
	return {
		read_token: read_token.bind(this),
		get_token: get_token.bind(this),
		refresh_token: refresh_token.bind(this),
		token: { access_token: "", refresh_token: "" } as saxo_t.auth_token_t
	}
}

async function read_token(this: Saxo) {
	const file = await Bun.file(token_file);
	if (!await file.exists()) return false;
	return await file.json() as saxo_t.auth_token_t;
}
function get_token(this: Saxo, code: string): Promise<boolean> {
	const url = conf.saxo.url.auth
	const params = make_token_params.bind(this)(code, "authorization_code")

	return this.fetch(endpoint, url, params)
		.then(res => res.json())
		.then((token: saxo_t.auth_token_t) => {
			save_token.bind(this)(token);
			return true
		});
}
function refresh_token(
	this: Saxo,
	refresh_token: string
): Promise<boolean> {
	const url = conf.saxo.url.auth;
	const params = make_token_params(refresh_token, "refresh_token");
	return this.fetch(endpoint, url, params)
		.then(res => res.json())
		.then(async (token: saxo_t.auth_token_t) => {
			await save_token.bind(this)(token);
			return true;
		})
		.catch(() => remove_token.bind(this)())
}

function keep_token_alive(this: Saxo) {
	if (!!this.keepalive) return;
	this.keepalive = setInterval(() => {
		refresh_token.bind(this)(this.oauth.token.refresh_token);
	}, keepalive_interval)

}

function remove_token(this: Saxo) {
	const file = Bun.file(token_file);
	return file.exists()
		.then(async exists => {
			if (exists) await file.delete();
			this.ws.publish("authorised", false, ["saxo"]);
			return false;
		})
}

async function save_token(
	this: Saxo,
	token: saxo_t.auth_token_t
): Promise<void> {
	this.oauth.token = token
	keep_token_alive.bind(this)()
	return Bun.write(token_file, JSON.stringify(token))
		.then(() => this.ws.publish("authorised", true, ["saxo"]));

}

function make_token_params(
	code: string,
	grant_type: "authorization_code" | "refresh_token"
): RequestInit {
	const auth_string = btoa(`${conf.saxo.app_key}:${conf.saxo.app_secret}`)
	const params = [
		`grant_type=${grant_type}`,
		`${grant_type === "authorization_code" ?
			"code" :
			"refresh_token"
		}=${code}`,
		`redirect_uri=${redirect}`
	].join("&")

	return {
		method: "POST",
		body: params,
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			Authorization: `Basic ${auth_string}`,
		}
	}
}
