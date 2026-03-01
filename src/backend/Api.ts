import type { App } from ".";
import type { saxo_t } from "../types";
import type { Brokers } from "./brokers"

type auth_code_t = saxo_t.auth_code_t;

export class Api implements Api_t {
	request = {
		accounts: (p: req_t) => res_accounts.bind(this, p)(),
		positions: (p: req_t) => res_positions.bind(this, p)(),
		is_authorised: (p: req_t, broker: broker_t) => res_is_authorised.bind(this, p)(broker),
		saxo_auth_url: (p: req_t) => res_saxo_auth_url.bind(this, p)(),
		saxo_authorise: (p: req_t, auth_code: auth_code_t) => res_saxo_authorise.bind(this, p)(auth_code),
	}
	set = {}

	init(app: App) {
		this.brokers = app.brokers;
	}

	protected brokers!: Brokers;

}
function res_accounts(this: Api, p: req_t) {
	this.brokers.get_accounts()
		.then(success => p.messenger.response(p.req_uid, success))
		.catch(err => server_error(p, err))
}
function res_positions(this: Api, p: req_t) {
	this.brokers.get_positions()
		.then(success => p.messenger.response(p.req_uid, success))
		.catch(err => server_error(p, err))
}
function res_is_authorised(this: Api, p: req_t, broker: broker_t) {
	this.brokers.is_authorised(broker)
		.then(is_authorised => p.messenger.response(p.req_uid, is_authorised))
		.catch(err => server_error(p, err))
}
function res_saxo_auth_url(this: Api, p: req_t) {
	this.brokers.get_saxo_code_url()
		.then(url => p.messenger.response(p.req_uid, url))
		.catch(err => server_error(p, err))
}
function res_saxo_authorise(
	this: Api,
	p: req_t,
	code: auth_code_t
) {
	this.brokers.get_saxo_token(code.code)
		.then(authorised => p.messenger.response(p.req_uid, authorised))
		.catch(err => server_error(p, err))
}

function server_error(p: req_t, err: any) {
	p.messenger.error(p.req_uid, 500, err)
}

export type topic_req_t = keyof InstanceType<typeof Api>["request"];
export type topic_set_t = keyof InstanceType<typeof Api>["set"];

