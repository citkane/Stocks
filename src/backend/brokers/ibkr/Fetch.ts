import { App, RateLimiter, type Ibkr } from "backend";
import { Broker } from "@backend/brokers/common/Broker";

import { ibkr as conf } from "conf";

const base_url = `${conf.url.base}/${conf.url.endpoints.api}`;
const limit_rate = 100;
const default_params: RequestInit = {
  tls: { rejectUnauthorized: false },
} as RequestInit;

export class Fetch extends Broker {
  constructor(app: App) {
    super(app);
  }
  public fetch<T = any>(
    this: Ibkr,
    endpoint: string,
    params: RequestInit = {},
  ) {
    params = { ...default_params, ...(params || {}) };
    const req = new Request(encodeURI(`${base_url}/${endpoint}`));
    return this.limiter.fetch(() =>
      fetch(req, params).then(this.response),
    ) as Promise<T>;
  }

  private limiter = new RateLimiter(limit_rate);
}
