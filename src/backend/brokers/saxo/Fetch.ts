import { Broker, RateLimiter } from "@backend/brokers/common/index";

const limit_rate = 250;
const { saxo } = conf;

export default class Fetch extends Broker {
  public fetch<T = any>(
    endpoint: string,
    base_url = saxo.url.api,
    params: RequestInit = {},
  ) {
    const default_params = this.default_params();
    params.headers = { ...default_params.headers, ...(params.headers || {}) };
    const req = new Request(encodeURI(`${base_url}/${endpoint}`));

    return this.limiter.fetch(() =>
      fetch(req, params).then(this.response),
    ) as Promise<T>;
  }

  private default_params(): RequestInit {
    const token = this.saxo.oauth.token;
    return {
      headers: {
        Authorization: `Bearer ${token.access_token}`,
      },
    };
  }

  private limiter = new RateLimiter(limit_rate);
}
