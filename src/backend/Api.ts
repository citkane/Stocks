import { Global } from "backend";
import { fe_ident } from "@common/Logger";

type auth_code_t = b.s.auth_code_t;

export default class Api extends Global implements Api_t {
  req = {
    auth_state: (p: req_t, broker: g.broker) => this.resp.auth_state(p, broker),
    saxo_auth_url: (p: req_t) => this.resp.saxo_fetch_auth_url(p),
    chart_data: (p: req_t, broker: g.broker, ...pa: pr.chart_period) => {
      this.resp.chart_data(p, broker, ...pa);
    },
    positns: (p: req_t) => this.resp.positns(p),
    instrmnts: (p: req_t) => this.resp.instrmnts(p),
    accnts: (p: req_t) => this.resp.accnts(p),
    balances: (p: req_t) => this.resp.balances(p),
    geo_map: (p: req_t) => this.resp.geo_map(p),
    logout: (p: req_t) => this.resp.logout(p),
    login: (p: req_t) => this.resp.login(p),
  };
  on = {
    saxo_token: (code: auth_code_t) => this.saxo_token(code),
    log_debug: (message: any[]) => this.log("debug", message),
    log_info: (message: any[]) => this.log("info", message),
    log_log: (message: any[]) => this.log("log", message),
    log_warn: (message: any[]) => this.log("warn", message),
    log_error: (message: any[]) => this.log("error", message),
  };

  private resp = {
    positns: async (p: req_t) => {
      const resp = this.brokers.resp.positns();
      p.messenger.response(p.req_uid, resp);
    },
    instrmnts: async (p: req_t) => {
      const resp = await this.brokers.resp.meta_views();
      p.messenger.response(p.req_uid, resp);
    },
    accnts: async (p: req_t) => {
      const resp = await this.brokers.resp.accnts();
      p.messenger.response(p.req_uid, resp);
    },
    balances: async (p: req_t) => {
      const resp = await this.brokers.resp.balances();
      p.messenger.response(p.req_uid, resp);
    },
    geo_map: async (p: req_t) => {
      const resp = await this.brokers.resp.geo_map();
      p.messenger.response(p.req_uid, resp);
    },
    auth_state: (p: req_t, broker: g.broker) => {
      p.messenger.response(p.req_uid, this[broker].auth_state);
    },
    saxo_fetch_auth_url: (p: req_t) => {
      this.brokers["saxo"]
        .fetch_auth_url()
        .then((url) => p.messenger.response(p.req_uid, url));
    },
    chart_data: (p: req_t, broker: g.broker, ...pa: pr.chart_period) => {
      this.brokers.chart
        .data(broker, ...pa)
        .then((data) => p.messenger.response(p.req_uid, data || []))
        .catch((err) => {
          throw Error(err);
        });
    },
    login: (p: req_t) => {
      const { brokers } = this;
      brokers
        .await_auth()
        .then(() => p.messenger.response(p.req_uid))
        .then(brokers.update_brokers);
    },
    logout: (p: req_t) => {
      this.brokers.logout().then(() => p.messenger.response(p.req_uid));
    },
  };
  private log = (level: level_t, message: any[]) => {
    try {
      logger[level](fe_ident, ...message);
    } catch (err) {
      logger.error(err);
      logger.error(message);
    }
  };
  private saxo_token = (code: auth_code_t) => {
    this.saxo.fetch_token(code.code); //.catch((err) => this.saxo.what_err(err));
  };
}

type level_t = "debug" | "info" | "log" | "warn" | "error";
