export default class FetchRateManager {
  constructor(
    req_max_per_period: number,
    req_max_concurrent: number,
    rpp_period_def: frm_period_t,
    hosts: frm_host_t[],
    private default_data_handler?: frm_data_handler_t,
    private debug_logger?: frm_logger_t,
    default_retry_timeout_ms = 1000,
    poll_queue_ms = 10,
  ) {
    this.hosts = hosts.map((d) => d.hostname);
    this.host.throw_on_clash();

    const { limiters } = FetchRateManager;
    if (limiters.has(this.hosts)) return;

    const rpp_period_ms = this.rpp_period_ms(rpp_period_def);
    limiters.set(this.hosts, {
      req_queue: [],
      req_max_per_period,
      req_max_concurrent,
      req_concurrent_count: 0,
      rpp_times_tracker: [],
      rpp_period_ms,
      rpp_period_def,
      default_retry_timeout_ms,
      retry_paused: false,
      hosts: this.host.reduce(hosts),
    });

    setInterval(this.dequeue, poll_queue_ms);
  }
  public fetch = <T = Response>(
    req: Request,
    data_handler?: frm_data_handler_t,
    skip_queue?: boolean,
    max_retry?: number,
  ) => {
    return this.queue_req<T>(req, data_handler, skip_queue, max_retry);
  };

  private queue_req = <T = any>(
    req: Request,
    data_hndlr = this.default_data_handler,
    skip_q = false,
    max_retry = 0,
  ): Promise<T> => {
    max_retry = Math.abs(max_retry);
    const { host, fetch_factory, unshift_queue, push_queue } = this;
    const { reject } = Promise;
    const hostnm = host.name(req);
    if (!host.exists(hostnm)) return reject(`Hostname not set: ${hostnm}`);

    const queued_req = new Promise((res, rej) => {
      const params = [res, rej, req, hostnm, max_retry, data_hndlr] as const;
      const req_fn = fetch_factory(...params);
      skip_q ? unshift_queue(req_fn) : push_queue(req_fn);
    });
    return queued_req as Promise<T>;
  };
  private fetch_factory = (
    resolve: resolve_t,
    reject: reject_t,
    req: Request,
    hostname: string,
    max_retry: number,
    data_handler?: frm_data_handler_t,
  ) => {
    const { limiter, handlers } = this;
    const { not_ok, fetch_err } = handlers;

    return async () => {
      const req_clone = req.clone();
      let res: any;
      try {
        res = await fetch(req_clone);
      } catch (err) {
        limiter.req_concurrent_count--;
        return fetch_err(reject, err, req, hostname, max_retry);
      }
      limiter.req_concurrent_count--;
      if (!res.ok) {
        return not_ok(reject, req, res, hostname, max_retry, data_handler);
      }
      console.error(data_handler?.toString());
      const data_or_res = data_handler
        ? await data_handler(req, res).catch(reject)
        : res;
      req = null as unknown as Request;
      resolve(data_or_res);
    };
  };

  private dequeue = () => {
    const { limiter } = this;
    const pause =
      !limiter.req_queue.length ||
      limiter.retry_paused ||
      limiter.req_concurrent_count >= limiter.req_max_concurrent;
    if (pause) return;

    const rpp = this.calc_rpp();
    if (rpp >= limiter.req_max_per_period) return;

    const now = new Date().valueOf();
    limiter.rpp_times_tracker.push(now);
    const req_fn = limiter.req_queue.shift()!;
    limiter.req_concurrent_count++;
    req_fn();

    if (this.debug_logger) this.debug_logger(this.host.debug_data(rpp));
  };
  private push_queue = (fn: Function) => {
    this.limiter.req_queue.push(fn);
  };
  private unshift_queue = (fn: Function) => {
    this.limiter.req_queue.unshift(fn);
  };
  private calc_rpp = () => {
    const { limiter } = this;
    const period_ago = new Date().valueOf() - limiter.rpp_period_ms;
    const index = limiter.rpp_times_tracker.findIndex(
      (time) => time > period_ago,
    );
    if (index === -1) return limiter.rpp_times_tracker.length;
    //limiter.rpp_times_tracker = limiter.rpp_times_tracker.filter(
    //  (time) => time > period_ago,
    //);
    limiter.rpp_times_tracker.splice(0, index);
    return limiter.rpp_times_tracker.length;
  };
  private rpp_period_ms = (period: frm_period_t) => {
    return FetchRateManager.period_ms[period];
  };

  private host = {
    throw_on_clash: () => {
      const { limiters } = FetchRateManager;
      if (limiters.has(this.hosts)) return;

      const ex_hosts = [...limiters.keys()].flat();
      const hosts_clash = this.hosts.reduce((clash_hosts, this_host) => {
        const clash = ex_hosts.find((ex_host) => ex_host === this_host);
        if (!clash) return clash_hosts;
        clash_hosts.push(clash);
        return clash_hosts;
      }, [] as string[]);
      if (hosts_clash.length) {
        const err_m = `Fetch rate limiter for ${hosts_clash.join(", ")} already defined.`;
        throw Error(err_m);
      }
    },
    reduce: (hosts: frm_host_t[]) => {
      return hosts.reduce(
        (hosts, host) => {
          hosts[host.hostname] = host;
          return hosts;
        },
        {} as { [hostname: string]: frm_host_t },
      );
    },
    user_retry: (res: Response, hostname: string) => {
      const { should_retry } = this.limiter.hosts[hostname]!;
      if (!should_retry) return false;
      return should_retry(res);
    },
    debug_data: (rpp: number) => {
      const {
        rpp_period_def: period,
        req_queue,
        req_concurrent_count: concurrent,
        req_max_per_period: rpp_max,
        req_max_concurrent: concurrent_max,
      } = this.limiter;
      return {
        rpp,
        rpp_max,
        period,
        concurrent,
        concurrent_max,
        queue: req_queue.length,
        hosts: this.hosts,
      };
    },
    name: (req: Request) => {
      return new URL(req.url).hostname;
    },
    exists: (hostname: string) => {
      return this.hosts.includes(hostname);
    },
  };
  private handlers = {
    fetch_err: (
      reject: reject_t,
      err: unknown,
      req: Request,
      hostname: string,
      max_retry: number,
    ) => {
      if (!max_retry) return reject(err);
      const { handlers } = this;
      const { retry, log_debug } = handlers;
      const url = new URL(req.url);
      const debug_mess = `Fetch errored without response for ${url.href}. Retrying [${max_retry}]`;
      log_debug(debug_mess);
      const params = [hostname, req, max_retry] as const;

      return retry(...params);
    },
    not_ok: (
      reject: reject_t,
      req: Request,
      res: Response,
      hostname: string,
      max_retry: number,
      data_handler?: frm_data_handler_t,
    ) => {
      const { host, handlers } = this;
      const { retry, log_debug } = handlers;
      const params = [hostname, req, max_retry, res, data_handler] as const;

      if (host.user_retry(res, hostname)) return retry(...params);
      if (!max_retry) return reject({ req, res });
      const url = new URL(req.url);
      const debug_mess = `Fetch ${res.status} ${res.statusText} for ${url.href}. Retrying [${max_retry}]`;
      log_debug(debug_mess);

      return retry(...params);
    },
    retry: (
      hostname: string,
      req: Request,
      max_retry: number,
      res?: Response,
      data_resolver?: frm_data_handler_t,
    ) => {
      const { limiter, handlers, queue_req } = this;
      const { log_debug } = handlers;
      const { set_retry_timeout_ms } = limiter.hosts[hostname]!;
      const timeout_ms =
        set_retry_timeout_ms && res
          ? set_retry_timeout_ms(res)
          : limiter.default_retry_timeout_ms;

      limiter.retry_paused = true;
      if (limiter.retry_timeout) clearTimeout(limiter.retry_timeout);
      limiter.retry_timeout = setTimeout(() => {
        limiter.retry_paused = false;
        log_debug(`Rate limiter unpaused`);
      }, timeout_ms);
      log_debug(`Rate limiter paused for ${timeout_ms}ms`);

      if (max_retry > 0) max_retry--;
      return queue_req(req, data_resolver, true, max_retry);
    },
    log_debug: (message: string) => {
      if (!this.debug_logger) return;
      const rpp = this.calc_rpp();
      const data = this.host.debug_data(rpp);
      this.debug_logger(data, message);
    },
  };

  private get limiter() {
    if (this.static_limiter) return this.static_limiter!;
    return (this.static_limiter = FetchRateManager.limiters.get(this.hosts)!);
  }
  private hosts: string[];
  private static_limiter?: static_limiter_t;
  private static limiters = new Map<string[], static_limiter_t>();
  private static period_ms = (() => {
    const sec = 1000;
    const min = sec * 60;
    const hr = min * 60;
    const day = hr * 24;
    return { sec, min, hr, day };
  })();
}

export type frm_constructor_t = ConstructorParameters<typeof FetchRateManager>;
export type frm_host_t = {
  hostname: string;
  should_retry?: frm_retry_handler_t;
  set_retry_timeout_ms?: frm_timeout_handler_t;
};
export type frm_retry_handler_t = (res: Response) => boolean;
export type frm_timeout_handler_t = (res: Response) => number;
export type frm_period_t = "sec" | "min" | "hr" | "day";
export type frm_data_handler_t = (req: Request, res: Response) => Promise<any>;
export type frm_logger_t = (data: frm_debug_data_t, message?: string) => void;
export type frm_debug_data_t = {
  rpp: number;
  rpp_max: number;
  period: frm_period_t;
  queue: number;
  concurrent: number;
  concurrent_max: number;
  hosts: string[];
};
type resolve_t = (value: unknown) => void;
type reject_t = (reason?: any) => void;
type static_limiter_t = {
  req_queue: Function[];
  req_max_per_period: number;
  req_max_concurrent: number;
  req_concurrent_count: number;
  rpp_times_tracker: number[];
  rpp_period_ms: number;
  rpp_period_def: frm_period_t;
  default_retry_timeout_ms: number;
  retry_paused: boolean;
  retry_timeout?: any;
  hosts: { [hostname: string]: frm_host_t };
};
