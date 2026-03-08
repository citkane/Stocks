import { saxo as conf } from "conf";
import { RateLimiter, type App } from "backend";
import { Oauth } from "backend/saxo";
import { Broker } from "@backend/brokers/common/Broker";

const limit_rate = 250;

export class Fetch extends Broker {
  constructor(app: App) {
    super(app);
  }
  public fetch<T = any>(
    endpoint: string,
    base_url = conf.url.api,
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
    return {
      headers: {
        Authorization: `Bearer ${Oauth.token.access_token}`,
      },
    };
  }

  private limiter = new RateLimiter(limit_rate);
}
