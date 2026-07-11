import { Global } from "backend";
import { fe_ident } from "@common/Logger";

type auth_code_t = b.s.auth_code_t;

export default class Api extends Global implements Api_t {
  requests = {
    auth_state: (p: req_t, broker: g.broker) => {
      this.resp.auth_state(p, broker);
    },
    saxo_auth_url: (p: req_t) => {
      this.resp.saxo_fetch_auth_url(p);
    },
    chart_data: (p: req_t, broker: g.broker, ...pa: pr.chart_period) => {
      this.resp.chart_data(p, broker, ...pa);
    },
    lv_positns: (p: req_t) => this.resp.lv_positns(p),
    meta: (p: req_t) => this.resp.meta(p),
    qid_map: (p: req_t) => this.resp.qid_map(p),
    logout: (p: req_t) => this.resp.logout(p),
    login: (p: req_t) => this.resp.login(p),
  };
  setter = {
    saxo_token: (code: auth_code_t) => this.action.saxo_token(code),
    log_debug: (message: any[]) => this.action.log("debug", message),
    log_info: (message: any[]) => this.action.log("info", message),
    log_log: (message: any[]) => this.action.log("log", message),
    log_warn: (message: any[]) => this.action.log("warn", message),
    log_error: (message: any[]) => this.action.log("error", message),
  };

  private resp = {
    lv_positns: async (p: req_t) => {
      const resp = await this.brokers.resp.lv_positns();
      p.messenger.response(p.req_uid, resp);
    },
    meta: async (p: req_t) => {
      const resp = await this.brokers.resp.metas();
      p.messenger.response(p.req_uid, resp);
    },
    qid_map: async (p: req_t) => {
      const resp = await this.brokers.resp.qid_map();
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
  private action = {
    log: (level: level_t, message: any[]) => {
      try {
        logger[level](fe_ident, ...message);
      } catch (err) {
        logger.error(err);
        logger.error(message);
      }
    },
    saxo_token: (code: auth_code_t) => {
      this.saxo.fetch_token(code.code); //.catch((err) => this.saxo.what_err(err));
    },
  };
}

type level_t = "debug" | "info" | "log" | "warn" | "error";
