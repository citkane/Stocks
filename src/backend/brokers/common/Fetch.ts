import { Global } from "backend";

type fetch_fnc_t = () => Promise<any>;
type params_factory_t = () => RequestInit;

export class Fetch extends Global {
  constructor(
    rate_limit: number,
    private params_factory: params_factory_t,
    private tls?: { tls: { [key: string]: any } },
  ) {
    super();
    this.limiter = new RateLimiter(rate_limit);
  }
  public fetch = <T>(url: string, params: RequestInit = {}) =>
    new Promise<T>((resolve, reject) =>
      this.queue(url, params, resolve, reject),
    );
  private queue = (
    url: string,
    params: RequestInit,
    resolve: resolve_t,
    reject: reject_t,
  ) => {
    params = deep_merge_params(this.default_params, params);

    const req = new Request(encodeURI(url), params);

    this.limiter.queue(() =>
      fetch(req.clone(), this.tls)
        .then((res) => this.response(res, req, resolve, reject))
        .catch((err) => reject(err)),
    );
  };

  private async response(
    res: Response,
    req: Request,
    resolve: resolve_t,
    reject: reject_t,
  ) {
    let { url, status, statusText, headers } = res;

    if (!res.ok) {
      const { headers, method } = req;
      const req_type = headers.get("content-type");
      const body = req_type?.includes("application/json") ? "json" : "text";
      return req[body]().then((body) =>
        reject({ "Fetch error: ": { url, method, status, statusText, body } }),
      );
    }
    const type = headers.get("content-type");
    req.text().then(() => null);
    type?.includes("application/json")
      ? res.json().then(resolve)
      : resolve(res);
  }

  private get default_params() {
    return this.params_factory();
  }
  private limiter: RateLimiter;
}

class RateLimiter extends Global {
  constructor(private rate: number) {
    super();
    const interval = setInterval(this.fetch, this.rate);
    this.add_shutdown_fnc(() => clearInterval(interval));
  }
  queue = (fnc: fetch_fnc_t) => {
    this.req_queue.push(fnc);
  };
  private fetch = () => {
    const fetch = this.req_queue.pop();
    !!fetch && fetch();
  };

  private req_queue: fetch_fnc_t[] = [];
}

function deep_merge_params(
  default_params: { [key: string]: any },
  target_params: { [key: string]: any },
) {
  const output = { ...default_params };
  Object.keys(target_params).forEach((key) => {
    output[key] = isObject(default_params[key])
      ? deep_merge_params(output[key] || {}, target_params[key])
      : target_params[key];
  });
  return output;
}
function isObject(item: any) {
  return item && typeof item === "object" && !Array.isArray(item);
}
