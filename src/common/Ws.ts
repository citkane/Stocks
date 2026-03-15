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
  //private respond = (mssg: message_t, p: req_t, api: api_t) =>
  //  this.responder(api, p, mssg);
  private respond(mssg: message_t, p: req_t, api: Api_t) {
    const { topic } = mssg;
    const params = get_params(mssg);
    const key = topic as keyof api_t["request"];
    const fnc = api.request[key] as Function;
    fnc(p, ...params);

    //try {
    //  fnc(p, ...params);
    //} catch (err) {
    //  console.error(mssg);
    //  console.error(err);
    //}
  }

  private action = (api: Api_t, mssg: message_t) => {
    const { topic } = mssg;
    const params = get_params(mssg);
    const key = topic as keyof api_t["set"];
    const fnc = api.set[key] as Function;
    fnc(...params);

    //try {
    //  fnc(...params);
    //} catch (err) {
    //  console.error(mssg);
    //  console.error(err);
    //}
  };

  private resolve_response(requests: requests_t, mssg: message_t) {
    const { res_uid } = mssg;
    const resolver = requests.get(res_uid!)!;
    requests.delete(mssg.res_uid!);
    mssg.error ? resolver.reject(mssg) : resolver.resolve(mssg);
  }
}

function get_params(mssg: message_t) {
  const { data, params } = mssg;
  let _params = !!data ? [data] : [];
  return !!params ? [..._params, ...params] : _params;
}
