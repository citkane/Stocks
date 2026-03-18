import { RateLimiter } from "@backend/brokers/common/index";
import { Global } from "backend";

const limit_rate = 100;

const { ibkr } = conf;
const base_url = `${ibkr.url.base}/${ibkr.url.endpoints.api}`;
const default_params = {
  tls: { rejectUnauthorized: false },
} as RequestInit;

export class Fetch extends Global {
  public fetch<T = any>(endpoint: string, params: RequestInit = {}) {
    params = { ...default_params, ...(params || {}) };
    const req = new Request(encodeURI(`${base_url}/${endpoint}`));
    return this.limiter.fetch(() => fetch(req, params)) as Promise<T>;
  }

  private limiter = new RateLimiter(limit_rate);
}
