import { RateLimiter } from "@backend/brokers/common/index";
import { Global } from "backend";

const limit_rate = 250;
const { saxo } = conf;

export class Fetch extends Global {
  public fetch<T = any>(
    endpoint: string,
    base_url = saxo.url.api,
    params: RequestInit = {},
  ) {
    const default_params = this.default_params();
    params.headers = { ...default_params.headers, ...(params.headers || {}) };
    const req = new Request(encodeURI(`${base_url}/${endpoint}`));

    return this.limiter.fetch(() => fetch(req, params)) as Promise<T>;
  }

  private default_params(): RequestInit {
    const bearer = this.saxo.auth_token.access_token;
    return {
      headers: {
        Authorization: `Bearer ${bearer}`,
      },
    };
  }

  private limiter = new RateLimiter(limit_rate);
}
