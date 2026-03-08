import type { App, Cache, Brokers } from "backend";
import type { saxo_t } from "types";

type auth_code_t = saxo_t.auth_code_t;

export class Api implements Api_t {
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
      this.res.wait_for_auth(p, broker);
    },
    wait_for_cache: (p: req_t) => {
      this.res.wait_for_cache(p);
    },
    saxo_auth_url: (p: req_t) => {
      this.saxo.auth_url.bind(this, p)();
    },
    saxo_authorise: (p: req_t, auth_code: auth_code_t) => {
      this.saxo.authorise.bind(this, p)(auth_code);
    },
  };
  set = {};

  init(app: App) {
    this.brokers = app.brokers;
    this.cache = app.cache;
  }
  private res = {
    accounts: (p: req_t) => {
      p.messenger.response(p.req_uid, this.cache.accounts);
    },
    positions: (p: req_t) => {
      p.messenger.response(p.req_uid, this.cache.positions);
    },

    is_authorised: (p: req_t, broker: broker_t) => {
      this.brokers
        .is_broker_authorised(broker)
        .then((is_authorised) => p.messenger.response(p.req_uid, is_authorised))
        .catch((err) => server_error(p, err));
    },
    wait_for_auth: (p: req_t, broker: broker_t) => {
      this.brokers
        .wait_for_auth(broker)
        .then(() => p.messenger.response(p.req_uid))
        .catch((err) => server_error(p, err));
    },
    wait_for_cache: (p: req_t) => {
      this.brokers
        .wait_for_brokers()
        .then(() => p.messenger.response(p.req_uid));
    },
  };
  private saxo = {
    auth_url: (p: req_t) => {
      this.brokers
        .get_saxo_code_url()
        .then((url) => p.messenger.response(p.req_uid, url))
        .catch((err) => server_error(p, err));
    },
    authorise: (p: req_t, code: auth_code_t) => {
      this.brokers
        .get_saxo_token(code.code)
        .then((authorised) => p.messenger.response(p.req_uid, authorised))
        .catch((err) => server_error(p, err));
    },
  };
  private ibkr = {};

  protected brokers!: Brokers;
  protected cache!: Cache;
}

function server_error(p: req_t, err: any) {
  console.error(err);
  p.messenger.error(p.req_uid, 500, err);
  //throw Error(err);
}

export type topic_req_t = keyof InstanceType<typeof Api>["request"];
export type topic_set_t = keyof InstanceType<typeof Api>["set"];
