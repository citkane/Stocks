import { Global } from "backend";
import { fe_ident } from "@common/Logger";

type auth_code_t = b.s.auth_code_t;

export default class Api extends Global implements Api_t {
  requests = {
    auth_state: (...pb: p.req_broker) => {
      this.res.auth_state(...pb);
    },
    wait_for_auth: (...pb: p.req_broker) => {
      this.res.wait_for_ready(...pb);
    },
    saxo_auth_url: (p: req_t) => {
      this.res.saxo_fetch_auth_url(p);
    },
    chart_data: (...pbd: [...p.req_broker, ...p.chart_period]) => {
      this.res.chart_data(...pbd);
    },
  };
  setter = {
    push_live_data: () => this.brokers.push_live_data(),
    push_cache: () => this.brokers.push_cache(),
    saxo_token: (code: auth_code_t) => this.action.saxo_token(code),
    logout: (broker: broker_t) => this[broker].logout(),
    login: (_broker: broker_t) => this.ibkr.login(),
    log_debug: (message: any[]) => this.action.log("debug", message),
    log_info: (message: any[]) => this.action.log("info", message),
    log_log: (message: any[]) => this.action.log("log", message),
    log_warn: (message: any[]) => this.action.log("warn", message),
    log_error: (message: any[]) => this.action.log("error", message),
  };

  private res = {
    auth_state: (p: req_t, broker: broker_t) => {
      p.messenger.response(p.req_uid, this.brokers[broker].auth_state);
    },
    wait_for_ready: (p: req_t, broker: broker_t) => {
      this.brokers[broker]
        .await_auth()
        .then(() => p.messenger.response(p.req_uid));
      //.catch((err) => server_error(p, err));
    },

    saxo_fetch_auth_url: (p: req_t) => {
      this.brokers["saxo"]
        .fetch_auth_url()
        .then((url) => p.messenger.response(p.req_uid, url));
      //.catch((err) => server_error(p, err));
    },

    chart_data: (p: req_t, broker: broker_t, ...pa: p.chart_period) => {
      this.brokers.chart
        .data(broker, ...pa)
        .then((data) => p.messenger.response(p.req_uid, data || []))
        .catch(this[broker].what_err);
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

function server_error(p: req_t, err: any) {
  let { status, statusText } = err as Response;
  status = status ? status : 500;
  statusText = statusText ? statusText : "Internal server error";
  const error = p.messenger.error(p.req_uid, err);
  logger.warn("API server error", error);
}

type level_t = "debug" | "info" | "log" | "warn" | "error";
