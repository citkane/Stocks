import Fetch, { type fm } from "@common/FetchManager";

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
      return {
        url: `${url.api}/portfolio/accounts`,
        req_init: this.fetcher.req_init(),
      };
    },
    balance: (a_id: string) => {
      return {
        url: `${url.api}/portfolio/${a_id}/ledger`,
        req_init: this.fetcher.req_init(),
      };
    },
    tickle: () => {
      return { url: `${url.api}/tickle`, req_init: this.fetcher.req_init() };
    },
    fx_rate: (source: string, target: string) => {
      return {
        url: `${url.api}/iserver/exchangerate?Source=${source}&Target=${target}`,
        req_init: this.fetcher.req_init(),
      };
    },
    bar_data: (conid: string, period: string, granularity: string) => {
      const params = new URLSearchParams({
        conid,
        period,
        bar: granularity,
      }).toString();
      return {
        url: `${url.api}/iserver/marketdata/history?${params}`,
        req_init: this.fetcher.req_init(),
      };
    },
    positions: (a_id: string) => {
      return {
        url: `${url.api}/portfolio2/${a_id}/positions`,
        req_init: this.fetcher.req_init(),
      };
    },
    position: (a_id: string, con_id: number) => {
      return {
        url: `${url.api}/portfolio/${a_id}/position/${con_id}`,
        req_init: this.fetcher.req_init(),
      };
    },
    validate_sso: () => {
      return {
        url: `${url.api}/sso/validate`,
        req_init: this.fetcher.req_init(),
      };
    },
  };
  public post = {
    transactions: (p: b.i.transactions_p) => {
      const body = JSON.stringify({
        acctIds: p.acc_ids,
        conids: p.con_ids,
        currency: p.curr,
        days: p.days_ago,
      });
      return {
        url: `${url.api}/pa/transactions`,
        req_init: this.fetcher.req_init({ method: "POST", body }),
      };
    },
    logout: () => {
      return {
        url: `${url.api}/logout`,
        req_init: this.fetcher.req_init({ method: "POST" }),
      };
    },
    auth_status: () => {
      return {
        url: `${url.api}/iserver/auth/status`,
        req_init: this.fetcher.req_init({ method: "POST" }),
      };
    },
    init_broker: () => {
      return {
        url: `${url.api}/iserver/auth/ssodh/init`,
        req_init: this.fetcher.req_init({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publish: true, compete: true }),
        }),
      };
    },
  };

  private fetcher = {
    req_init: (req_init: RequestInit = {}): RequestInit => {
      return { tls, ...req_init } as RequestInit;
    },
    response_cb: async (res: Response) => {
      const type = res.headers.get("content-type");
      const data = type?.includes("json") ? await res.json() : await res.text();
      return data;
    },
    trace_cb: (data: fm.trace_data) => {
      console.info(data);
    },
    constructor: () => {
      const { response_cb, trace_cb } = this.fetcher;
      const options = { response_cb, trace_cb };
      const { hostname, port } = new URL(conf.ibkr.base);
      const hosts = [`${hostname}:${port}`];
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

declare global {
  namespace b {
    namespace i {
      type transactions_p = {
        acc_ids: string[];
        con_ids: string[];
        curr: string;
        days_ago: number;
      };
    }
  }
}
