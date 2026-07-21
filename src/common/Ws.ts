import type { Messenger } from "./Messenger";

type api_t = frontend.Api_t | backend.Api_t;
type requests_t = Messenger["requests"];

export class Ws {
  protected route = (
    api: Api_t,
    requests: requests_t,
    messenger: Messenger,
    mssg: message_t,
  ) => {
    const { req_uid, res_uid } = mssg;
    const is_action = !req_uid && !res_uid;
    const is_response = !!res_uid;
    const is_request = !!req_uid;

    if (is_action) return this.action(api, mssg);
    if (is_response) return this.resolve_response(requests, mssg);
    if (is_request) this.respond(mssg, { messenger, req_uid }, api);
  };
  private respond(mssg: message_t, p: req_t, api: Api_t) {
    const { topic } = mssg;
    const params = get_params(mssg);
    const key = topic as keyof api_t["req"];
    const fnc = api.req[key] as Function;
    this.logger.debug("WS response cache:", Object.keys(api.req).length);
    fnc(p, ...params);
  }

  private action = (api: Api_t, mssg: message_t) => {
    const { topic } = mssg;
    const params = get_params(mssg);
    const key = topic as keyof api_t["on"];
    const fnc = api.on[key] as Function;
    this.logger.debug("WS setter cache:", Object.keys(api.on).length);

    fnc(...params);
  };

  private resolve_response(requests: requests_t, mssg: message_t) {
    const { res_uid } = mssg;
    const resolver = requests.get(res_uid!)!;
    requests.delete(mssg.res_uid!);
    this.logger.debug("WS requests queue:", requests.size);

    mssg.error ? resolver.reject(mssg) : resolver.resolve(mssg.data);
  }

  private get logger() {
    return typeof logger === "undefined" ? console : logger;
  }
}

function get_params(mssg: message_t) {
  const { data, params } = mssg;
  let _params = !!data ? [data] : [];
  return !!params ? [..._params, ...params] : _params;
}
