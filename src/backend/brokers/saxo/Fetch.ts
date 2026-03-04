import { saxo as conf } from "conf";
import { RateLimiter, type Saxo } from "backend";
import { Oauth } from "backend/saxo";

const limit_rate = 250;

export class Fetch {
  public fetch(
    this: Saxo,
    endpoint: string,
    base_url = conf.url.api,
    params: RequestInit = {},
  ) {
    const default_params = this.default_params.bind(this)();
    params.headers = { ...default_params.headers, ...(params.headers || {}) };
    const req = new Request(encodeURI(`${base_url}/${endpoint}`));

    return this.limiter.fetch(() => fetch(req, params));
  }

  private default_params(this: Saxo): RequestInit {
    return {
      headers: {
        Authorization: `Bearer ${Oauth.token.access_token}`,
      },
    };
  }

  private limiter = new RateLimiter(limit_rate);
}
