import { Global } from "backend";

const max_retry = 3;

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

  public retry_fetch = <T, F extends () => fetch_t = () => fetch_t>(
    callback: F,
    err: any,
    retry = 0,
  ) =>
    new Promise<T>((res) => {
      setTimeout(() => {
        logger.debug(err, `Retry: ${retry}`);
        callback()
          .then((data) => res(data as T))
          .catch(() => {
            if (retry > max_retry) {
              logger.error(err);
              throw err;
            }
            retry++;
            res(this.retry_fetch(callback, err, retry));
          });
      }, 1000);
    });

  private queue = (
    url: string,
    params: RequestInit,
    resolve: resolve_t,
    reject: reject_t,
  ) => {
    params = deep_merge_params(this.default_params, params);

    const req = new Request(encodeURI(url), params);
    const _req = req.clone();

    this.limiter.queue(() =>
      fetch(_req, this.tls)
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
        reject({ url, method, status, statusText, body }),
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
    this.add_shutdown_fncs(() => clearInterval(interval));
  }
  queue = (fnc: fetch_fnc_t) => {
    this.req_queue.push(fnc);
    logger.debug("Fetch queue:", "PUSH", this.req_queue.length);
  };
  private fetch = () => {
    const fetch = this.req_queue.pop();
    if (!fetch) return;

    logger.debug("Fetch queue:", "POP", this.req_queue.length);
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

type fetch_t = ReturnType<InstanceType<typeof Fetch>["fetch"]>;
type fetch_fnc_t = () => Promise<any>;
type params_factory_t = () => RequestInit;
