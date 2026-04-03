import { Global } from "backend";

type auth_code_t = b.s.auth_code_t;

export default class Api extends Global implements Api_t {
  requests = {
    accounts: (p: req_t) => {
      this.res.accounts(p);
    },
    positions: (p: req_t) => {
      this.res.positions(p);
    },
    is_authorised: (...pb: p.req_broker) => {
      this.res.is_authorised(...pb);
    },
    wait_for_auth: (...pb: p.req_broker) => {
      this.res.wait_for_ready(...pb);
    },
    //wait_for_cache: (p: req_t) => {
    //  this.res.wait_for_cache(p);
    //},
    saxo_auth_url: (p: req_t) => {
      this.res.saxo_fetch_auth_url(p);
    },

    chart_data: (...pbd: [...p.req_broker, ...p.chart_data]) => {
      this.res.chart_data(...pbd);
    },
  };
  setter = {
    saxo_make_token: (code: auth_code_t) => {
      this.action.saxo_make_token(code);
    },
  };

  private res = {
    accounts: async (p: req_t) => {
      await this.brokers.await_cache();
      const accounts = await this.cache.accounts;
      p.messenger.response(p.req_uid, accounts);
    },
    positions: async (p: req_t) => {
      await this.brokers.await_cache();
      const positions = await this.cache.transactions;
      p.messenger.response(p.req_uid, positions);
    },

    is_authorised: (p: req_t, broker: broker_t) => {
      p.messenger.response(p.req_uid, this.brokers[broker].is_authorised);
    },
    wait_for_ready: (p: req_t, broker: broker_t) => {
      this.brokers[broker]
        .await_auth()
        .then(() => p.messenger.response(p.req_uid))
        .catch((err) => server_error(p, err));
    },

    saxo_fetch_auth_url: (p: req_t) => {
      this.brokers["saxo"]
        .fetch_auth_url()
        .then((url) => p.messenger.response(p.req_uid, url))
        .catch((err) => server_error(p, err));
    },

    chart_data: (p: req_t, broker: broker_t, ...pa: p.chart_data) => {
      this.brokers.chart
        .data(broker, ...pa)
        .then((data) => p.messenger.response(p.req_uid, data || []))
        .catch((err) => server_error(p, err));
    },
  };
  private action = {
    saxo_make_token: (code: auth_code_t) => {
      this.saxo.fetch_auth_token(code.code);
    },
  };

  private get cache() {
    return this.brokers.cache;
  }
}

function server_error(p: req_t, err: any) {
  console.error(err);
  p.messenger.error(p.req_uid, 500, err);
}
