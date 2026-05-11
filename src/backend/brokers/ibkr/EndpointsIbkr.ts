import { Global } from "@backend/Global";

const base = conf.ibkr.base;
const endpoints = {
  api: "v1/api",
};
const url = {
  api: `${base}/${endpoints.api}`,
};

export class EndpointsIbkr extends Global {
  public get = {
    accounts: () => `${url.api}/portfolio/accounts`,
    balance: (a_id: string) => `${url.api}/portfolio/${a_id}/ledger`,
    tickle: () => `${url.api}/tickle`,
    fx_rate: (source: currency_t, target: currency_t) => {
      return `${url.api}/iserver/exchangerate?Source=${source}&Target=${target}`;
    },
    bar_data: (conid: string, period: string, granularity: string) => {
      const params = [
        `conid=${conid}`,
        `period=${period}`,
        `bar=${granularity}`,
      ].join("&");
      return `${url.api}/iserver/marketdata/history?${params}`;
    },
    positions: (a_id: string) => {
      return `${url.api}/portfolio2/${a_id}/positions`;
    },
    position: (a_id: string, con_id: string) => {
      return `${url.api}/portfolio/${a_id}/position/${con_id}`;
    },
    validate_sso: () => {
      return `${url.api}/sso/validate`;
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
        params: {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        },
      };
    },
    logout: () => {
      return { url: `${url.api}/logout`, params: { method: "POST" } };
    },
    auth_status: () => {
      return {
        url: `${url.api}/iserver/auth/status`,
        params: { method: "POST" },
      };
    },
    init_broker: () => {
      const params = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publish: true, compete: true }),
      };
      return { url: `${url.api}/iserver/auth/ssodh/init`, params };
    },
  };
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
