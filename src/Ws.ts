import type { Messenger } from "./backend";
import type { message_t } from "./types";

export type respond_t = (mssg: message_t, p: req_t) => void
export type action_t = (mssg: message_t) => void
type requests_t = Messenger["requests"]

export class Ws {

	protected resolve_response(requests: requests_t, mssg: message_t) {
		const { res_uid } = mssg;
		const resolver = requests.get(res_uid!)!;
		requests.delete(mssg.res_uid!);
		mssg.error ?
			resolver.reject(mssg) :
			resolver.resolve(mssg);

	}
}
