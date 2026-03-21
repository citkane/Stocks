import { Global } from "backend";

type fetch_fnc_t = () => Promise<any>;
type params_factory_t = () => RequestInit;

export class Fetch extends Global {
  constructor(
    rate_limit: number,
    private params_factory: params_factory_t,
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
    const req = new Request(encodeURI(url));
    params = { ...this.default_params, ...params };
    this.limiter.queue(() =>
      fetch(req, params)
        .then((res) => this.response(res, resolve, reject))
        .catch((err) => reject(err)),
    );
  };
  private response(res: Response, resolve: resolve_t, reject: reject_t) {
    const { url, status, statusText, ok, headers } = res;
    const type = headers.get("content-type");

    if (!ok) {
      return reject({ "Fetch error: ": { url, status, statusText } });
    }
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
    //this.req_queue.length && console.log("fetch queue", this.req_queue.length);
    const fetch = this.req_queue.pop();
    !!fetch && fetch();
  };

  private req_queue: fetch_fnc_t[] = [];
}
