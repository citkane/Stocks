import { Broker } from "@backend/brokers/common";
import Fetch, { type frm_host_t } from "@common/FetchRateManager";

const req_max_per_s = 100,
  req_max_concurrent = 10,
  base = conf.ibkr.base,
  endpoints = {
    api: "v1/api",
  },
  url = {
    api: `${base}/${endpoints.api}`,
  },
  req_init = {
    tls: { rejectUnauthorized: false },
  } as RequestInit;

export class EndpointsIbkr extends Broker {
  protected get = {
    accounts: () => new Request(`${url.api}/portfolio/accounts`, req_init),
    balance: (a_id: string) =>
      new Request(`${url.api}/portfolio/${a_id}/ledger`, req_init),
    tickle: () => new Request(`${url.api}/tickle`, req_init),
    fx_rate: (source: currency_t, target: currency_t) => {
      return new Request(
        `${url.api}/iserver/exchangerate?Source=${source}&Target=${target}`,
        req_init,
      );
    },
    bar_data: (conid: string, period: string, granularity: string) => {
      const params = new URLSearchParams({
        conid,
        period,
        bar: granularity,
      }).toString();
      return new Request(
        `${url.api}/iserver/marketdata/history?${params}`,
        req_init,
      );
    },
    positions: (a_id: string) => {
      return new Request(`${url.api}/portfolio2/${a_id}/positions`, req_init);
    },
    position: (a_id: string, con_id: number) => {
      return new Request(
        `${url.api}/portfolio/${a_id}/position/${con_id}`,
        req_init,
      );
    },
    validate_sso: () => {
      return new Request(`${url.api}/sso/validate`, req_init);
    },
  };
  protected post = {
    transactions: (p: b.i.transactions_p) => {
      const body = JSON.stringify({
        acctIds: p.acc_ids,
        conids: p.con_ids,
        currency: p.curr,
        days: p.days_ago,
      });
      return new Request(`${url.api}/pa/transactions`, {
        ...req_init,
        ...{
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        },
      });
    },
    logout: () => {
      return new Request(`${url.api}/logout`, { ...req_init, method: "POST" });
    },
    auth_status: () => {
      return new Request(`${url.api}/iserver/auth/status`, {
        ...req_init,
        method: "POST",
      });
    },
    init_broker: () => {
      return new Request(`${url.api}/iserver/auth/ssodh/init`, {
        ...req_init,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publish: true, compete: true }),
      });
    },
  };
  private fetcher = {
    should_retry: (_res: Response) => true,
    set_retry_ms: (_res: Response) => 1000,
    hosts: () => {
      return [new URL(conf.ibkr.base).hostname].map(
        (hostname) =>
          ({
            hostname,
            should_retry: this.fetcher.should_retry,
            set_retry_timeout_ms: this.fetcher.set_retry_ms,
          }) as frm_host_t,
      );
    },
    data_resolver: async (res: Response) => {
      const type = res.headers.get("content-type");
      const data = type?.includes("json") ? await res.json() : await res.text();
      return data;
    },
    error_handler: (err: Response | Error | undefined, message?: string) => {
      console.error(err);
    },
    constructor: () =>
      [
        req_max_per_s,
        req_max_concurrent,
        "sec",
        this.fetcher.hosts(),
        this.fetcher.data_resolver,
      ] as const,
  };
  protected fetch = new Fetch(...this.fetcher.constructor()).fetch;
}

declare global {
  namespace b {
    namespace i {
      type transactions_p = {
        acc_ids: string[];
        con_ids: string[];
        curr: currency_t;
        days_ago: number;
      };
    }
  }
}
