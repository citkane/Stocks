type fetch_fnc = () => Promise<Response>;
type fetcher = [fetch_fnc, resolve_t, resolve_t];

export class RateLimiter {
  constructor(private rate: number) {
    this.start_interval();
  }
  fetch = (fnc: fetch_fnc) => {
    return new Promise((resolve, reject) => {
      this.req_queue.push([fnc, resolve, reject]);
    }) as Promise<any>;
  };
  private response(
    res: Response,
    resolve: resolve_t,
    reject: reject_t,
  ): Promise<any> {
    if (!res.ok) {
      const { url, status, statusText } = res;
      const err_message = `Error in fetch response:\n${JSON.stringify({ url, status, statusText }, null, 4)}`;
      return reject(err_message);
    }
    const type = res.headers.get("content-type");
    if (type?.includes("application/json")) return resolve(res.json());
    return resolve(res);
  }

  private start_interval = () => {
    return setInterval(() => {
      if (!this.req_queue.length) return;
      const [fetch_fnc, resolve, reject] = this.req_queue.pop()!;

      fetch_fnc().then((res) => this.response(res, resolve, reject));
      //.catch((err) => reject({ err }));
    }, this.rate);
  };
  private req_queue: fetcher[] = [];
}
