import { Global } from "backend";

type auth_code_t = saxo_t.auth_code_t;

export default class Api extends Global implements Api_t {
  request = {
    accounts: (p: req_t) => {
      this.res.accounts(p);
    },
    positions: (p: req_t) => {
      this.res.positions(p);
    },
    is_authorised: (p: req_t, broker: broker_t) => {
      this.res.is_authorised(p, broker);
    },
    wait_for_auth: (p: req_t, broker: broker_t) => {
      this.res.wait_for_ready(p, broker);
    },
    //wait_for_cache: (p: req_t) => {
    //  this.res.wait_for_cache(p);
    //},
    saxo_auth_url: (p: req_t) => {
      this.res.saxo_fetch_auth_url(p);
    },
    saxo_authorise: (p: req_t, auth_code: auth_code_t) => {
      this.res.saxo_set_auth_token(p, auth_code);
    },
    chart_data: (
      p: req_t,
      broker: broker_t,
      conid: string,
      period: period_t,
      granularity: period_t,
    ) => {
      this.res.chart_data(p, broker, conid, period, granularity);
    },
  };
  set = {};

  private res = {
    accounts: (p: req_t) => {
      p.messenger.response(p.req_uid, this.cache.accounts);
    },
    positions: (p: req_t) => {
      p.messenger.response(p.req_uid, this.cache.positions);
    },

    is_authorised: (p: req_t, broker: broker_t) => {
      this.brokers[broker]
        .is_authorised()
        .then((is_authorised) => p.messenger.response(p.req_uid, is_authorised))
        .catch((err) => server_error(p, err));
    },
    wait_for_ready: (p: req_t, broker: broker_t) => {
      this.brokers[broker]
        .await_ready()
        .then(() => p.messenger.response(p.req_uid))
        .catch((err) => server_error(p, err));
    },
    saxo_set_auth_token: (p: req_t, code: auth_code_t) => {
      this.brokers["saxo"]
        .set_auth_token(code.code)
        .then((authorised) => p.messenger.response(p.req_uid, authorised))
        .catch((err) => server_error(p, err));
    },
    saxo_fetch_auth_url: (p: req_t) => {
      this.brokers["saxo"]
        .fetch_auth_url()
        .then((url) => p.messenger.response(p.req_uid, url))
        .catch((err) => server_error(p, err));
    },
    //wait_for_cache: (p: req_t) => {
    //  this.brokers.init_brokers().then(() => p.messenger.response(p.req_uid));
    //},
    chart_data: (
      p: req_t,
      broker: broker_t,
      conid: string,
      period: period_t,
      granularity: period_t,
    ) => {
      this.brokers[broker]
        .chart_data(conid, period, granularity)
        .then((data) => p.messenger.response(p.req_uid, data));
    },
  };
  private get cache() {
    return this.brokers.cache;
  }
}

function server_error(p: req_t, err: any) {
  logger.error(err);
  p.messenger.error(p.req_uid, 500, err);
  //throw Error(err);
}
