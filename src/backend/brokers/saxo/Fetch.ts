import { saxo as conf } from "../../../../conf.json";
import { RateLimiter } from "../RateLimiter.ts";
import type { Saxo } from ".";

const limit_rate = 250;

export class Fetch {

	protected fetch(
		this: Saxo,
		endpoint: string,
		base_url = conf.url.api,
		params: RequestInit = {}
	) {
		const default_params = this.default_params.bind(this)();
		params.headers = { ...default_params.headers, ...(params.headers || {}) };
		const req = new Request(encodeURI(`${base_url}/${endpoint}`));

		return this.limiter.fetch(() => fetch(req, params));
	}


	private default_params(this: Saxo): RequestInit {
		return {
			headers: {
				Authorization: `Bearer ${this.oauth.token.access_token}`
			}
		}
	}

	private limiter = new RateLimiter(limit_rate);
}
