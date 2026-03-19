import { Global } from "backend";

type fetch_fnc = () => Promise<any>;

export class Fetch extends Global {
  constructor(
    rate_limit: number,
    private default_params: () => RequestInit,
  ) {
    super();
    this.limiter = new RateLimiter(rate_limit);
  }
  public fetch<T = any>(url: string, params: RequestInit = {}) {
    params = { ...this.default_params(), ...(params || {}) };
    const req = new Request(encodeURI(url));
    return new Promise<T>((resolve, reject) =>
      this.limiter.fetch(() =>
        fetch(req, params)
          .then((res) => this.response<T>(res, resolve, reject))
          .catch((err) => reject(err)),
      ),
    );
  }
  private response<T>(
    res: Response,
    resolve: resolve_t,
    reject: reject_t,
  ): Promise<T> {
    if (!res.ok) {
      const { url, status, statusText } = res;
      const err_message = `Error in fetch response:\n${JSON.stringify({ url, status, statusText }, null, 4)}`;
      return reject(err_message);
    }
    const type = res.headers.get("content-type");
    if (type?.includes("application/json")) return resolve(res.json());
    return resolve(res);
  }
  private limiter: RateLimiter;
}

class RateLimiter {
  constructor(private rate: number) {
    this.poll();
  }
  fetch = (fnc: fetch_fnc) => {
    this.req_queue.push(fnc);
  };
  private poll = () =>
    setInterval(() => {
      if (!this.req_queue.length) return;
      const fetch_fnc = this.req_queue.pop()!;
      fetch_fnc();
    }, this.rate);

  private req_queue: fetch_fnc[] = [];
}
