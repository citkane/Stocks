import type { Api as backend_api_t } from "./backend";
import type { Api as frontend_api_t } from "./frontend";
import type { Messenger } from "."
import type { message_t } from "./types";

//export type respond_t = (mssg: message_t, p: req_t) => void
//export type action_t = (mssg: message_t) => void

type api_t = frontend_api_t | backend_api_t
type requests_t = Messenger["requests"]



export class Ws {
	protected route = (
		api: api_t,
		requests: requests_t,
		messenger: Messenger,
		mssg: message_t
	) => {
		const { req_uid, res_uid } = mssg
		const is_action = !req_uid && !res_uid
		const is_response = !!res_uid
		const is_request = !!req_uid

		if (is_action) return this.action(api, mssg);
		if (is_response) return this.resolve_response(requests, mssg);
		if (is_request) this.respond(mssg, { messenger, req_uid }, api)
	}
	private respond = (mssg: message_t, p: req_t, api: api_t) => this.responder(api, p, mssg)
	private responder(
		api: api_t,
		p: req_t,
		mssg: message_t,
	) {
		const { topic } = mssg;
		const params = get_params(mssg);
		const key = topic as keyof api_t;
		const fnc = api[key] as Function;
		return fnc(p, ...params)
	}

	private action = (api: api_t, mssg: message_t) => {
		const { topic } = mssg;
		const params = get_params(mssg);
		const key = topic as keyof api_t;
		const fnc = api[key] as Function;
		return fnc(...params);
	}

	private resolve_response(
		requests: requests_t,
		mssg: message_t
	) {
		const { res_uid } = mssg;
		const resolver = requests.get(res_uid!)!;
		requests.delete(mssg.res_uid!);
		mssg.error ?
			resolver.reject(mssg) :
			resolver.resolve(mssg);

	}
}

function get_params(mssg: message_t) {
	const { data, params } = mssg;
	let _params = !!data ? [data] : []
	return !!params ? [..._params, ...params] : _params;
}
