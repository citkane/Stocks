import { Global } from "backend";
import { fe_ident } from "@common/Logger";

type auth_code_t = b.s.auth_code_t;

export default class Api extends Global implements Api_t {
  requests = {
    //accounts: (p: req_t) => {
    //  this.res.accounts(p);
    //},
    //transactions: (p: req_t) => {
    //  this.res.transactions(p);
    //},
    //instruments: (p: req_t) => {
    //  this.res.instruments(p);
    //},
    is_authorised: (...pb: p.req_broker) => {
      this.res.is_authorised(...pb);
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
    //save_instrument: (p: req_t, instrmnt: instrmnt_t) => {
    //  this.res.save_instrument(p, instrmnt);
    //},
    //link_html: (p: req_t, link: string) => {
    //  logger.log(link);
    //  this.res.link_html(p, link);
    //},
  };
  setter = {
    push_live_data: () => this.brokers.push_live_data(),
    push_cache: () => this.brokers.push_cache(),
    saxo_token: (code: auth_code_t) => this.saxo.fetch_token(code.code),
    log_debug: (message: any[]) => this.action.log("debug", message),
    log_info: (message: any[]) => this.action.log("info", message),
    log_log: (message: any[]) => this.action.log("log", message),
    log_warn: (message: any[]) => this.action.log("warn", message),
    log_error: (message: any[]) => this.action.log("error", message),
  };

  private res = {
    //accounts: async (p: req_t) => {
    //  await this.brokers.await_cache();
    //  const accounts = await this.cache.accounts;
    //  p.messenger.response(p.req_uid, accounts);
    //},
    //transactions: async (p: req_t) => {
    //  await this.brokers.await_cache();
    //  const transactions = await this.cache.transactions;
    //  p.messenger.response(p.req_uid, transactions);
    //},
    //instruments: async (p: req_t) => {
    //  await this.brokers.await_cache();
    //  //const instruments = await this.cache.instruments;
    //  //p.messenger.response(p.req_uid, instruments);
    //},
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

    chart_data: (p: req_t, broker: broker_t, ...pa: p.chart_period) => {
      this.brokers.chart
        .data(broker, ...pa)
        .then((data) => p.messenger.response(p.req_uid, data || []))
        .catch((err) => server_error(p, err));
    },
    //link_html: (p: req_t, link: string) => {
    //  TV.fetch(link)
    //    .then((html) => p.messenger.response(p.req_uid, html))
    //    .catch((err) => server_error(p, err));
    //},
    //save_instrument: (p: req_t, instrmnt: instrmnt_t) => {
    //  this.brokers.instrument
    //    .save(instrmnt)
    //    .then(() => p.messenger.response(p.req_uid));
    //},
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
