import { type topic_t as topic_backend_t } from "./backend/Api.ts"
import { type topic_t as topic_frontend_t } from "./frontend/Api.ts"

type context_t = void | "backend" | "frontend"

export type data_t = object | string | number | boolean;
export type topic_t<T = void> =
	[T] extends [void] ? topic_backend_t | topic_frontend_t :
	T extends 'backend' ? topic_backend_t :
	T extends 'frontend' ? topic_frontend_t :
	never;
export type message_t<T = void, D = data_t> = {
	topic: topic_t<T>;
	data: D;
	req_uid?: string;
	res_uid?: string;
	params?: string[];
	error?: boolean
}

export class Messenger {
	constructor(private ws: ws_t) { }

	static decode = <T = context_t, D = data_t,>(message: string): message_t<T, D> => {
		const mssg_array = JSON.parse(message) as [topic_t<T>, D, string?, string?, string[]?, boolean?];
		const [topic, data, req_uid, res_uid, params, error] = mssg_array;
		return {
			topic,
			data,
			req_uid,
			res_uid,
			params,
			error
		}
	}
	static encode = (
		topic: topic_t | "",
		data: data_t,
		req_uid?: string,
		res_uid?: string,
		params?: string[],
		error?: boolean
	) => {
		return JSON.stringify([topic, data, req_uid, res_uid, params, error]);
	}

	request<T = context_t, D = data_t>(
		topic: topic_t<T>,
		data: data_t = "",
		params?: string[]
	) {
		const req_uid = this.get_uid();
		return new Promise<message_t<T, D>>((resolve, reject) => {
			this.requests.set(req_uid, { resolve, reject });
			this.send(topic, data, req_uid, undefined, params);
		})
	}
	response = (res_uid: string, data: data_t) => {
		this.send("", data, undefined, res_uid)
	}
	send(
		topic: topic_t | "",
		data: data_t,
		req_uid?: string,
		res_uid?: string,
		params?: string[],
		error?: boolean) {
		const mssg = Messenger.encode(topic, data, req_uid, res_uid, params, error)
		this.ws.send(mssg);
	}
	error(uid: string, res: Response): void
	error(uid: string, status: number, statusText: any): void;
	error(uid: string, res_status: Response | number, statusText?: string) {
		let error: res_error_t;
		if (!!statusText) {
			const res = statusText as unknown as Response
			if (res instanceof Response) return this.error(uid, res);
			const status = res_status as number;
			statusText = typeof statusText === "object" ? (statusText as Object).toString() : statusText
			error = { status, statusText }
		} else {
			const { status, statusText } = res_status as Response;
			error = { status, statusText }
		}
		//console.error(`Response ${uid}:`, error);
		this.send("", error, undefined, uid, undefined, true)
		return;
	}

	public requests = new Map<string, resolver_t>;
	private request_id = 0;
	private get_uid() {
		this.request_id++
		const uid = this.request_id.toString();

		return uid;
	}

}

