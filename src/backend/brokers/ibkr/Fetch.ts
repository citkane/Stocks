import { RateLimiter } from "backend";
import { ibkr as conf } from "conf";

import type { Ibkr } from "..";

const base_url = `${conf.url.base}/${conf.url.endpoints.api}`;
const limit_rate = 100;
const default_params: RequestInit = {
  tls: { rejectUnauthorized: false },
} as RequestInit;

export class Fetch {
  public fetch(this: Ibkr, endpoint: string, params: RequestInit = {}) {
    params = { ...default_params, ...(params || {}) };
    const req = new Request(encodeURI(`${base_url}/${endpoint}`));
    return this.limiter.fetch(() => fetch(req, params));
  }

  private limiter = new RateLimiter(limit_rate);
}
