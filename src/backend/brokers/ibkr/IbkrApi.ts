import Fetch, { LibCallback } from "@common/FetchManager";

const req_max_per_s = 100,
  req_max_concurrent = 10,
  base = conf.ibkr.base,
  endpoints = {
    api: "v1/api",
  },
  url = {
    api: `${base}/${endpoints.api}`,
  },
  tls = { rejectUnauthorized: false };

export class IbkrApi {
  public get = {
    accounts: () => {
      const { fetcher } = this;
      const init = { headers: fetcher.headers() };
      return {
        url: `${url.api}/portfolio/accounts`,
        req_init: this.fetcher.req_init(init),
      };
    },
    balance: (a_id: string) => {
      const { fetcher } = this;
      const init = { headers: fetcher.headers() };
      return {
        url: `${url.api}/portfolio/${a_id}/ledger`,
        req_init: fetcher.req_init(init),
      };
    },
    tickle: () => {
      const { fetcher } = this;
      const init = { headers: fetcher.headers() };
      return {
        url: `${url.api}/tickle`,
        req_init: this.fetcher.req_init(init),
      };
    },
    fx_rate: (source: string, target: string) => {
      const { fetcher } = this;
      const init = { headers: fetcher.headers() };
      return {
        url: `${url.api}/iserver/exchangerate?Source=${source}&Target=${target}`,
        req_init: this.fetcher.req_init(init),
      };
    },
    bar_data: (conid: string, period: string, granularity: string) => {
      const { fetcher } = this;
      const init = { headers: fetcher.headers() };
      const params = new URLSearchParams({
        conid,
        period,
        bar: granularity,
      }).toString();
      return {
        url: `${url.api}/iserver/marketdata/history?${params}`,
        req_init: this.fetcher.req_init(init),
      };
    },
    positions: (a_id: string) => {
      const { fetcher } = this;
      const init = { headers: fetcher.headers() };
      return {
        url: `${url.api}/portfolio2/${a_id}/positions`,
        req_init: this.fetcher.req_init(init),
      };
    },
    position: (a_id: string, con_id: number) => {
      const { fetcher } = this;
      const init = { headers: fetcher.headers() };
      return {
        url: `${url.api}/portfolio/${a_id}/position/${con_id}`,
        req_init: this.fetcher.req_init(init),
      };
    },
    validate_sso: () => {
      const { fetcher } = this;
      const init = { headers: fetcher.headers() };
      return {
        url: `${url.api}/sso/validate`,
        req_init: this.fetcher.req_init(init),
      };
    },
  };
  public post = {
    transactions: ([acctIds, conids, currency, days]: readonly [
      string[],
      number[],
      string,
      number,
    ]) => {
      const { fetcher } = this;
      const headers = fetcher.headers();
      headers.append("Content-Type", "application/json");
      const body = JSON.stringify({
        acctIds,
        conids,
        currency,
        days,
      });
      return {
        url: `https://localhost:5000/v1/api/pa/transactions`,
        req_init: fetcher.req_init({
          method: "POST",
          headers,
          body,
        }),
      };
    },
    logout: () => {
      const { fetcher } = this;
      const init = { method: "POST", headers: fetcher.headers() };
      return {
        url: `${url.api}/logout`,
        req_init: this.fetcher.req_init(init),
      };
    },
    auth_status: () => {
      // req_init: (req_init: RequestInit = {}): RequestInit => {
    },
    init_broker: () => {
      const { fetcher } = this;
      const headers = fetcher.headers();
      headers.append("Content-Type", "application/json");
      return {
        url: `${url.api}/iserver/auth/ssodh/init`,
        req_init: this.fetcher.req_init({
          method: "POST",
          headers,
          body: JSON.stringify({ publish: true, compete: true }),
        }),
      };
    },
  };

  private fetcher = {
    headers: () => {
      const headers = new Headers();
      headers.append("User-Agent", "StocksApp/0.0 Portfolio viewer app");
      return headers;
    },
    req_init: (req_init: RequestInit): RequestInit => {
      return { tls, ...req_init } as RequestInit;
    },
    response_cb: async (res: Response) => {
      const type = res.headers.get("content-type");
      const data = type?.includes("json") ? await res.json() : await res.text();
      return data;
    },
    constructor: () => {
      const { retry, timeout } = new LibCallback<"url">(),
        timeout_cb = timeout.backoff_factory(),
        retry_cb = retry.generic_factory(),
        { response_cb } = this.fetcher;

      const options = { response_cb, retry_cb, timeout_cb },
        { hostname, port } = new URL(conf.ibkr.base),
        hosts = [`${hostname}:${port}`];

      return [
        req_max_per_s,
        req_max_concurrent,
        "sec",
        hosts,
        options,
      ] as const;
    },
  };
  public fetch = new Fetch(...this.fetcher.constructor()).fetch;
}
