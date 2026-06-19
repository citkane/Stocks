export default class FetchManager<G extends fm.kind> {
  constructor(...pms: fm.constrctr_pms<G>) {
    const default_opts = {
      timeout_ms: 500,
      heartbeat: 20,
    };
    const { limiters } = FetchManager;
    const { err, hosts, args, dequeue, limiter_factory } = this;
    const new_hosts: fm.host<G>[] = pms[3];
    if (!new_hosts.length) err.throw("No hosts given in constructor", pms);

    const new_host_keys = hosts.make_host_keys(new_hosts);
    const err_mssg = args.do_hosts_clash(new_host_keys, limiters);
    if (err_mssg) {
      err.throw(err_mssg, pms, {
        new_host_keys,
        ex_host_keys: Object.keys(limiters),
      });
    }

    this.fetch = this.fetch.bind(this);
    this.host_keys = new_host_keys;
    if (limiters.has(this.host_keys)) {
      const mssg = "Host set was already defined. Previous options are used.";
      err.warn(mssg, this.host_keys);
      return;
    }

    pms[4] = args.constructor_opts(default_opts, ...pms);
    const limiter: t.limiter<fm.kind> = limiter_factory(...pms) as any;
    limiters.set(this.host_keys, limiter);

    setInterval(dequeue, pms[4].heartbeat);
  }

  public fetch<T = f.Rs, K extends f.knd = G>(...p: f.r_o<K>): Promise<T>;
  public fetch<T = f.Rs, K extends f.knd = G>(...p: f.r_p<K>): Promise<T[]>;
  public fetch<T = f.Rs, K extends f.knd = G>(...p: f.r_o_p<K>): Promise<T[]>;
  public fetch<T = f.Rs, K extends f.knd = G>(...p: f.u_i): Promise<T>;
  public fetch<T = f.Rs, K extends f.knd = G>(...p: f.u_o<K>): Promise<T>;
  public fetch<T = f.Rs, K extends f.knd = G>(...p: f.u_o_p<K>): Promise<T[]>;
  public fetch<T = f.Rs, K extends f.knd = G>(...p: f.u_p<K>): Promise<T[]>;
  public fetch<T = f.Rs, K extends f.knd = G>(...p: f.u_i_o<K>): Promise<T>;
  public fetch<T = f.Rs, K extends f.knd = G>(...p: f.u_i_p<K>): Promise<T[]>;
  public fetch<T = f.Rs, K extends f.knd = G>(...p: f.u_i_o_p<K>): Promise<T[]>;
  public fetch(this: FetchManager<G>, ...pms: f.fetch_pms<G>) {
    const { queue_req, args, err } = this;
    const { fetch_overload_args, make_ctx, ident_req_kind } = args;
    const { reject } = err;
    const req_or_url: string | Request = pms[0];
    const kind = ident_req_kind(req_or_url);
    if (!kind) return reject("A `Request.url` or url string must be provided.");

    const ctx_pms = fetch_overload_args(kind, ...pms);
    const part_ctx = make_ctx(ctx_pms);
    return queue_req(part_ctx);
  }

  private native_fetch = (ctx: t.ctx<G>) => {
    const { url, req_init, req } = ctx.ctx_req;
    const req_clone = req ? req.clone() : undefined;
    return req_clone ? fetch(req_clone) : fetch(url!, req_init);
  };
  private queue_req = async (part_ctx: Partial<t.ctx<G>>) => {
    const { fetch_factory, unshift_queue, push_queue, err } = this;
    const { skip_queue, hostname, resolve } = part_ctx;
    const full_ctx = !!resolve ? (part_ctx as t.ctx<G>) : undefined;
    if (full_ctx) {
      const req_fn = fetch_factory(full_ctx);
      skip_queue ? unshift_queue(req_fn) : push_queue(req_fn);
      return;
    }

    const def = { defined: this.host_keys };
    const is_def = def.defined.includes(hostname!);
    if (!is_def) return err.reject(`Hostname not defined: ${hostname}`, def);

    return new Promise((resolve, reject) => {
      const full_ctx = { ...part_ctx, resolve, reject } as t.ctx<G>;
      const req_fn = fetch_factory(full_ctx);
      skip_queue ? unshift_queue(req_fn) : push_queue(req_fn);
    });
  };
  private dequeue = () => {
    const { limiter, handle } = this;
    const { reqs, paused, rpp } = limiter;
    const is_stopped = reqs.stop(),
      is_throttled = rpp.throttle(),
      is_paused = paused.refr_state();

    const ctx = reqs.queue[0]?.get_ctx();
    if (ctx) setTimeout(() => handle.trace(ctx));
    if (is_stopped || is_throttled || is_paused) return;

    const { execute_fetch } = reqs.queue.shift()!;
    rpp.increment();
    reqs.incr_concurrent();
    execute_fetch();
  };
  private push_queue = (fns: t.fetch_fn<G>) => {
    const { queue } = this.limiter.reqs;
    queue.push(fns);
  };
  private unshift_queue = (fns: t.fetch_fn<G>) => {
    const { queue } = this.limiter.reqs;
    queue.unshift(fns);
  };

  private fetch_factory = (ctx: t.ctx<G>): t.fetch_fn<G> => {
    const { response_cb, pager_cb, resolve, reject, ctx_req } = ctx;
    const { limiter, handle, args, native_fetch } = this;
    const { reqs } = limiter;
    const { pager, error } = handle;
    const { to_fm_req } = args;
    return {
      execute_fetch,
      get_ctx: () => ctx,
    };

    async function execute_fetch() {
      let resp: Response;
      try {
        resp = await native_fetch(ctx);
      } catch (err) {
        reqs.decr_concurrent();
        return error(ctx, err as Error);
      }
      reqs.decr_concurrent();
      if (!resp.ok) return error(ctx, resp);

      if (pager_cb) return pager(ctx, resp, pager_cb);
      if (!response_cb) return resp;

      try {
        const req = to_fm_req(ctx_req);
        const data = response_cb(resp, req);
        resolve(data);
      } catch (err) {
        reject(err);
      }
    }
  };
  private limiter_factory = (
    max_rpp: number,
    max_concurrency: number,
    rpp_period: fm.period,
    fm_hosts: fm.host<G>[],
    options?: fm.constrctr_opts<G>,
  ): t.limiter<G> => {
    const { handle, err } = this;
    const hosts = this.hosts.fm_to_ctx_hosts(fm_hosts);
    const { response_cb, retry_cb, timeout_cb, trace_cb } = options!;
    const reqs = reqs_factory(max_concurrency);
    const paused = paused_factory(options!);
    const rpp = rpp_factory(rpp_period, max_rpp);

    return {
      timeout_ms: options!.timeout_ms!,
      hosts,
      reqs,
      paused,
      rpp,
      response_cb,
      retry_cb,
      timeout_cb,
      trace_cb,
    };

    function paused_factory(options: fm.constrctr_opts<G>): t.limiter_paused {
      const { warn } = err;
      const { trace } = handle;
      const { heartbeat } = options;
      const paused = { set_state, refr_state, state, ms: 0 };
      return paused;

      function refr_state() {
        paused.ms = paused.ms ? paused.ms - heartbeat! : 0;
        paused.ms = paused.ms < 0 ? 0 : paused.ms;
        return state();
      }
      function set_state(ms: number) {
        if (!ms) return;
        if (ms < 0) return warn(`Cannot pause on negative (${ms})ms`);

        ms = Math.ceil(ms / heartbeat!) * heartbeat!;
        if (ms <= paused.ms) return;

        paused.ms = ms;
        const ctx = reqs.queue[0]?.get_ctx();
        if (ctx) trace(ctx, `Fetch is paused for ${paused.ms}ms`);
      }
      function state() {
        return paused.ms > 0;
      }
    }
    function reqs_factory(max_concurrency: number): t.limiter_reqs<G> {
      const reqs = {
        queue: [],
        concurrency: 0,
        max_concurrency,
        incr_concurrent,
        decr_concurrent,
        stop,
        why_stopped,
      };
      return reqs;

      function incr_concurrent() {
        reqs.concurrency++;
      }
      function decr_concurrent() {
        reqs.concurrency--;
      }
      function stop() {
        if (!reqs.queue.length) return true;
        return reqs.concurrency >= reqs.max_concurrency;
      }
      function why_stopped() {
        if (!stop()) return undefined;
        return !reqs.queue.length ? "queue empty" : "max concurrency";
      }
    }
    function rpp_factory(period: fm.period, max: number): t.limiter_rpp {
      const rpp_period_ms = FetchManager.period_ms[period];
      const rpp_tracker: number[] = [];
      const rpp = { rate: 0, max, period, is_throttled, throttle, increment };
      return rpp;
      function is_throttled() {
        return rpp.rate >= max ? `[${rpp.rate}:${max}]` : undefined;
      }
      function throttle() {
        rpp.rate = calc_rpp();
        return rpp.rate >= max;
      }
      function increment() {
        const now = new Date().valueOf();
        rpp_tracker.push(now);
      }
      function calc_rpp() {
        const period_ago = new Date().valueOf() - rpp_period_ms;
        const index = rpp_tracker.findIndex((time) => time > period_ago);
        if (index === -1) return rpp_tracker.length;

        rpp_tracker.splice(0, index);
        return rpp_tracker.length;
      }
    }
  };

  private args = {
    constructor_opts: (
      required_options: fm.constrctr_opts<G>,
      ...pms: fm.constrctr_pms<G>
    ) => {
      const user_options: fm.constrctr_opts<G> = pms[4] || {};
      Object.entries(required_options).forEach((entry) => {
        const [key, value] = entry as [keyof fm.constrctr_opts<G>, any];
        if (!user_options[key]) user_options[key] = value;
      });
      return user_options;
    },
    ident_req_kind: (req_or_url: string | Request) => {
      const req_kind: fm.kind | undefined =
        req_or_url instanceof Request && req_or_url.url.length
          ? "req"
          : req_or_url === "string" && req_or_url.length
            ? "url"
            : undefined;
      return req_kind;
    },
    fetch_overload_args: (
      req_kind: fm.kind,
      ...pms: f.fetch_pms<G>
    ): t.ctx_pms<G> => {
      return req_kind === "url" ? req_url_kind() : req_req_kind();

      function req_req_kind() {
        const [req, opt_page, page] = pms.filter(empty_obj) as [
          Request,
          fm.fetch_opts<G> | fm.pager_cb<G> | undefined,
          fm.pager_cb<G> | undefined,
        ];
        const options = is_option(opt_page)
          ? (opt_page as fm.fetch_opts<G>)
          : undefined;
        const pager_cb = opt_page instanceof Function ? opt_page : page;

        return {
          req,
          options,
          pager_cb,
        };
      }

      function req_url_kind() {
        const [url, init_opt_page, opt_page, page] = pms.filter(empty_obj) as [
          string,
          RequestInit | fm.fetch_opts<G> | fm.pager_cb<G> | undefined,
          fm.fetch_opts<G> | fm.pager_cb<G> | undefined,
          fm.pager_cb<G> | undefined,
        ];
        const req_init =
          !is_option(init_opt_page) && !(init_opt_page instanceof Function)
            ? (init_opt_page as RequestInit | undefined)
            : undefined;
        const options = [init_opt_page, opt_page].find((v) => is_option(v)) as
          | fm.fetch_opts<G>
          | undefined;
        const pager_cb = [init_opt_page, opt_page, page].find(
          (v) => v instanceof Function,
        ) as fm.pager_cb<G> | undefined;

        return {
          url,
          req_init,
          options,
          pager_cb,
        };
      }
      function empty_obj(obj: any) {
        if (obj instanceof Request) return true;
        return !(
          typeof obj === "object" &&
          !Array.isArray(obj) &&
          Object.keys(obj).length === 0
        );
      }
      function is_option(v: any) {
        if (!v || v instanceof Function) return false;
        if (typeof v !== "object") return false;
        const options: fm.fetch_opts<G> = {
          response_cb: undefined,
          trace_cb: undefined,
          skip_queue: undefined,
          force_retry: undefined,
        };
        return !!Object.keys(options).find((key) => Object.hasOwn(v, key));
      }
    },
    make_ctx: (pms: t.ctx_pms<G>): Partial<t.ctx<G>> => {
      const { hosts, limiter } = this;
      const { options, url, req, req_init, pager_cb } = pms;
      const hostname = hosts.hostname(url, req);
      const host = limiter.hosts[hostname]!;
      const ctx_req: t.ctx_req = { url, req_init, req };
      const page_collector = { user: [] as any[], system: [] as Response[] };
      const handlers = cascade_handlers();
      return {
        ctx_req,
        hostname,
        skip_queue: false,
        force_retry: 0,
        page_collector,
        ...(options || {}),
        ...handlers,
      };

      function cascade_handlers() {
        const handler_keys: (keyof t.handlers<G>)[] = [
          "response_cb",
          "retry_cb",
          "timeout_cb",
          "trace_cb",
        ];
        const handlers = {
          pager_cb,
        } as t.handlers<G> & { pager_cb?: fm.pager_cb<G> };
        return [limiter, host, options].reduce((handlers, opts) => {
          handler_keys.forEach((key) => {
            if (opts && opts[key]) handlers[key] = opts[key] as any;
          });
          return handlers;
        }, handlers);
      }
    },
    do_hosts_clash: (
      host_keys: string[],
      limiters: typeof FetchManager.limiters,
    ) => {
      if (limiters.has(host_keys)) return false;

      const ex_hosts = [...limiters.keys()].flat();
      const clashing_hosts = host_keys.reduce((clash_hosts, this_host) => {
        const clash = ex_hosts.find((ex_host) => ex_host === this_host);
        if (!clash) return clash_hosts;
        clash_hosts.push(clash);
        return clash_hosts;
      }, [] as string[]);

      return clashing_hosts.length
        ? `Hosts already defined in other groups: [ ${clashing_hosts.join(", ")} ]`
        : false;
    },
    to_ctx_req: (fm_req: fm.req<G>): t.ctx_req => {
      if (fm_req instanceof Request) return { req: fm_req };
      return fm_req;
    },
    to_fm_req: (ctx_req: t.ctx_req): fm.req<G> => {
      const { req, url, req_init } = ctx_req;
      if (req) return req.clone() as fm.req<G>;
      return { url, req_init } as fm.req<G>;
    },
  };
  private hosts = {
    make_debug_data: (ctx: t.ctx<G>, mssg?: string): fm.trace_data => {
      const { force_retry, hostname, skip_queue } = ctx;
      const { rpp, reqs, paused } = this.limiter;
      const href = this.hosts.href(ctx);
      return {
        message: mssg,
        paused: paused.ms ? `${(paused.ms / 1000).toFixed(2)}sec` : undefined,
        stopped: reqs.why_stopped(),
        throttled: rpp.is_throttled(),
        rpp: rpp.rate,
        rpp_max: rpp.max,
        rpp_period: rpp.period,
        concurrency: reqs.concurrency,
        max_concurrency: reqs.max_concurrency,
        queue: reqs.queue.length,
        force_retry,
        skip_queue,
        hostname,
        href,
      };
    },
    make_host_keys: (hosts: fm.host<G>[]) => {
      const host_strings = hosts.map((host) => {
        return typeof host === "string" ? host : host.hostname;
      });
      return [...new Set(host_strings)];
    },
    fm_to_ctx_hosts: (hosts: fm.host<G>[]) => {
      const { err } = this;
      return hosts.reduce(reducer, {} as { [hostname: string]: t.host<G> });

      function reducer(
        hosts: { [hostname: string]: t.host<G> },
        fm_host: fm.host<G>,
      ) {
        const is_host = typeof fm_host !== "string";
        const host = is_host ? fm_host : { hostname: fm_host };
        const { hostname } = host;
        if (!hosts[hostname]) {
          hosts[hostname] = host;
          return hosts;
        }
        const mssg = `${hostname} is defined multiple times. Options from first instance retained`;
        err.warn(mssg, host);
        return hosts;
      }
    },
    href: (context: t.ctx<G>) => {
      const { req, url } = context.ctx_req;
      const url_string = req ? req.url : url!;
      return new URL(url_string).href;
    },
    hostname: (url?: string, req?: Request) => {
      const url_string = req ? req.url : url!;
      let { hostname, port } = new URL(url_string);
      hostname = port ? `${hostname}:${port}` : hostname;
      return hostname;
    },
  };
  private handle = {
    error: (ctx: t.ctx<G>, resp: Response | Error) => {
      const { retry, trace, should_retry } = this.handle;
      const { hosts, err } = this;
      const href = hosts.href(ctx);
      const mssg =
        resp instanceof Response
          ? err.message(`${resp.status} ${resp.statusText} for ${href}.`)
          : err.message(`Fetch errored before response for ${href}.`);
      trace(ctx, mssg);
      if (should_retry(ctx, resp)) return retry(ctx, resp);

      ctx.reject(resp);
    },
    should_retry: (ctx: t.ctx<G>, resp: Response | Error) => {
      const { ctx_req, retry_cb, force_retry, reject } = ctx;
      const req = this.args.to_fm_req(ctx_req);
      if (force_retry) return true;
      if (!retry_cb) return false;

      try {
        resp = resp instanceof Response ? resp.clone() : resp;
        return retry_cb(resp, req);
      } catch (err) {
        reject(err);
        return false;
      }
    },
    retry: (ctx: t.ctx<G>, resp: Response | Error) => {
      const { handle } = this;
      let { force_retry } = ctx;
      ctx.skip_queue = force_retry > 0 ? false : true;
      if (force_retry)
        ctx.force_retry = force_retry > 0 ? force_retry-- : force_retry++;
      handle.pause(ctx, resp);
      this.queue_req(ctx);
    },
    pause: (ctx: t.ctx<G>, resp: Response | Error) => {
      const { timeout_cb, reject, ctx_req } = ctx;
      const { paused, timeout_ms } = this.limiter;
      const ms = timeout_ms;
      if (!timeout_cb) return paused.set_state(ms);

      try {
        const { to_fm_req } = this.args;
        resp = resp instanceof Response ? resp.clone() : resp;
        const ms = timeout_cb(resp, to_fm_req(ctx_req));
        paused.set_state(ms);
      } catch (err) {
        reject(err);
      }
    },
    trace: (context: t.ctx<G>, mssg?: string) => {
      const { trace_cb } = context;
      const { make_debug_data } = this.hosts;
      if (!trace_cb) return;

      const data = make_debug_data(context, mssg);
      trace_cb(data);
    },
    pager: async (ctx: t.ctx<G>, resp: Response, pager_cb: fm.pager_cb<G>) => {
      const { queue_req, args } = this;
      const { to_fm_req } = args;
      const { response_cb, resolve, reject, ctx_req, page_collector } = ctx;
      const { user, system } = page_collector;
      const req = to_fm_req(ctx_req);
      let new_req: t.pager_cb_rtn<G>;
      try {
        new_req = await pager_cb(resp.clone(), req, user);
      } catch (err) {
        reject(err);
      }
      system.push(resp);
      if (new_req) {
        ctx.skip_queue = true;
        ctx.ctx_req = args.to_ctx_req(new_req);
        return queue_req(ctx);
      }
      if (user.length) return resolve(user);
      if (!response_cb) return resolve(system);
      try {
        const resp_array = await Promise.all(
          system.map((res) => response_cb(res, req)),
        );
        resolve(resp_array);
      } catch (err) {
        reject(err);
      }
    },
  };
  private err = {
    message: (mssg: string) => {
      return `[${this.class_name}] ${mssg}`;
    },
    reject: (mssg: string, ...warn: any[]) => {
      if (warn && warn.length) this.err.warn(mssg, ...warn);
      mssg = this.err.message(mssg);
      return new Promise((_res, rej) => rej(mssg));
    },
    throw: (mssg: string, ...details: any[]) => {
      const cause = { message: mssg, details };
      throw Error(this.err.message(mssg), { cause });
    },
    warn: (mssg: string, ...data: any[]) => {
      mssg = this.err.message(mssg);
      console.warn(mssg, ...data);
    },
  };

  private get limiter() {
    if (this.static_limiter) return this.static_limiter!;
    return (this.static_limiter = FetchManager.limiters.get(
      this.host_keys,
    )! as t.limiter<G>);
  }
  private host_keys: string[];
  private static_limiter?: t.limiter<G>;
  private class_name = this.constructor.name;

  private static limiters = new Map<string[], t.limiter<fm.kind>>();
  private static period_ms = (() => {
    const sec = 1000;
    const min = sec * 60;
    const hr = min * 60;
    const day = hr * 24;
    return { sec, min, hr, day };
  })();
}

export class LibCallback<G extends fm.kind> implements t.lib_cb<G> {
  pager = {
    param_factory: (
      ctx: "headers" | "body",
      search_pms_cb: (count: number) => { [key: string]: string },
      count_key: string,
      flag_next_key?: string,
    ) => {
      const P = Promise.all.bind(Promise);

      return async (resp: Response, req: fm.req<G>) => {
        const [count, proceed] = await get_context(resp)
          .then((ctx) => P([ctx, get_count(ctx)]))
          .then(([ctx, count]) => P([count, get_proceed(ctx, count)]));
        if (!proceed) return;

        return get_search_params(count)
          .then((pms) => get_new_url(pms, req))
          .then((url) => make_new_req(url, req));
      };

      async function get_context(resp: Response): Promise<{
        [key: string]: number | string;
      }> {
        return ctx === "body" ? await resp.json() : resp.headers.toJSON();
      }
      function get_count(context: { [key: string]: string | number }) {
        const count = context[count_key] ? Number(context[count_key]) : 0;
        if (Number.isNaN(count))
          throw `Failed to get pager count on key ${count_key}`;

        return count;
      }
      function get_proceed(
        context: { [key: string]: string | number },
        count: number,
      ) {
        if (!flag_next_key) return count > 0;
        return !!context[flag_next_key];
      }
      async function get_search_params(count: number) {
        try {
          return new URLSearchParams(search_pms_cb(count));
        } catch (err) {
          throw new Error("search_pms_cb failed", { cause: err });
        }
      }
      function get_new_url(search_params: URLSearchParams, req: fm.req<G>) {
        const url = new URL(req.url);
        search_params.forEach((val, key) => url.searchParams.set(key, val));
        return url.toString();
      }
      function make_new_req(url: string, req: fm.req<G>) {
        return req instanceof Request
          ? (new Request(url, req as Request) as fm.req<G>)
          : ({ url, req_init: req.req_init } as fm.req<G>);
      }
    },
  };
  retry = {
    generic_factory: (
      retry_status: number[] = [429, 503],
      max_error?: number,
      max_fail?: number,
    ) => {
      let errs = 0;
      let fails = 0;
      return (res: Response | Error) => {
        if (res instanceof Error) {
          if (!max_error) return false;
          errs++;
          return errs >= max_error;
        }
        if (retry_status.includes(res.status)) {
          if (!max_fail) return true;
          fails++;
          return fails >= max_fail;
        }
        return false;
      };
    },
  };
  timeout = {
    backoff_factory: () => {
      let count = 0;
      let ms = 0;
      let time = new Date().valueOf();
      return () => {
        count++;
        ms = Math.random() * 500 * count;
        const now = new Date().valueOf();
        if (now - time > ms * 2) {
          count--;
          time = now;
        }
        return ms;
      };
    },
    response_factory:
      (header_key: string, val_cb: (time: string | null | Error) => number) =>
      (res: Response | Error) => {
        if (res instanceof Error) return val_cb(res);
        return val_cb(res.headers.get(header_key));
      },
  };
  response = {
    generic: async (res: Response) => {
      const type = res.headers.get("content-type");
      if (!type) return res;
      if (type.includes("json")) return await res.json();
      if (type.includes("text")) return await res.text();
      return res;
    },
  };
  trace = {
    generic: (data: fm.trace_data) => {
      console.info(data);
    },
  };
}

/** Public FetchManager types */
export namespace fm {
  /** The `fetch` method accepts a `Request` instance or `string` url */
  export type kind = "req" | "url";
  /**
   * Optional callback function that flags if request should be retried.
   * @param resp {@link Response}
   * @param fm_req {@link Request} || {@link t.req_url}
   * @returns `boolean`
   */
  export type retry_cb<K extends kind> = (
    resp: Response | Error,
    fm_req: req<K>,
  ) => boolean;
  /**
   * Optional callback function that sets milliseconds to pause the fetch queue.
   * @param resp {@link Response}
   * @param fm_req {@link Request} || {@link t.req_url}
   * @returns `number` of ms
   */
  export type t_out_cb<K extends kind> = (
    resp: Response | Error,
    fm_req: req<K>,
  ) => number;
  /**
   * Optional callback function to alter returned data after `Response` is recieved.
   * @param resp {@link Response}
   * @param fm_req {@link Request} || {@link t.req_url}
   * @returns `any`
   */
  export type resp_cb<K extends kind> = (resp: Response, fm_req: req<K>) => any;
  /**
   * Optional callback function to manage request paging.
   * @param resp {@link Response}
   * @param collector `any[]` - optional data collector. If used,
   * it will be returned as the `fetch` result negating further defined handlers.
   * @param fm_req {@link Request} || {@link t.req_url}
   * @returns
   * + Next page request: {@link Request} || {@link t.req_url} as K || Promise\<K\>
   * + Stop paging:`undefined` || `null` as K || Promise\<K\>
   */
  export type pager_cb<K extends kind> = (
    resp: Response,
    fm_req: req<K>,
    collector: any[],
  ) => t.pager_cb_rtn<K> | Promise<t.pager_cb_rtn<K>>;
  /**
   * Optional callback function providing data for trace debugging.
   * @param data {@link trace_data}
   * @returns `void`
   */
  export type trace_cb = (data: trace_data) => void;
  /** Data provided for debugging */
  export type trace_data = {
    message?: string;
    paused?: string;
    stopped?: string;
    throttled?: string;
    rpp: number;
    rpp_max: number;
    rpp_period: period;
    concurrency: number;
    max_concurrency: number;
    queue: number;
    skip_queue: boolean;
    force_retry: number;
    hostname: string;
    href: string;
  };
  /** Time period for rate calculation */
  export type period = "sec" | "min" | "hr" | "day";
  /**
   * FetchManager class constructor parameters
   * @param req_max_per_period `number` - Fetch rate limit for the period.
   * @param req_max_concurrent `number` - Limit for maximum concurrent requests.
   * @param rpp_period_def {@link period} - Time period for fetch rate.
   * @param unique_hosts `string[]` || {@link fm.host fm.host[]} - Set of hosts on which to apply limits.
   * @param options {@link fm.constrctr_opts} - Optional user settings
   */
  export type constrctr_pms<K extends kind> = [
    req_max_per_period: number,
    req_max_concurrent: number,
    rpp_period_def: fm.period,
    unique_hosts: fm.host<K>[],
    options?: fm.constrctr_opts<K>,
  ];
  /**
   * User options for the class constructor.
   * @param default_retry_timeout_ms `number` - ms to pause before retrying a request.
   * @param heartbeat `number` - frequency in ms to poll the request queue.
   * @param response_cb {@link fm.resp_cb}
   * @param retry_cb {@link fm.retry_cb}
   * @param timeout_cb {@link fm.t_out_cb}
   * @param trace_cb {@link fm.trace_cb}
   */
  export type constrctr_opts<K extends kind> = {
    timeout_ms?: number;
    heartbeat?: number;
  } & t.handlers<K>;
  /**
   * User options for a {@link FetchManager.fetch} method call.
   * @param skip_queue `boolean` - Sends a request to the front of the queue
   * @param force_retry `number` - Automatically retry a failed request x number of times:
   * + `-2` will retry twice from the front of the queue.
   * + `2` will retry twice from the back of the queue.
   * @param response_cb {@link fm.resp_cb}
   * @param retry_cb {@link fm.retry_cb}
   * @param timeout_cb {@link fm.t_out_cb}
   * @param trace_cb {@link fm.trace_cb}
   */
  export type fetch_opts<K extends kind> = {
    skip_queue?: boolean;
    force_retry?: number;
  } & t.handlers<K>;
  /**
   *
   */
  export type host<K extends kind> =
    | ({
        hostname: string;
      } & t.handlers<K>)
    | string;

  export type req<K extends kind> = K extends "req"
    ? Request
    : K extends "url"
      ? t.req_url
      : t.req_url | Request;
}
/** Private types */
namespace t {
  export type handlers<K extends fm.kind> = {
    response_cb?: fm.resp_cb<K>;
    retry_cb?: fm.retry_cb<K>;
    timeout_cb?: fm.t_out_cb<K>;
    trace_cb?: fm.trace_cb;
  };
  export type req_url = { url: string; req_init?: RequestInit };
  export type pager_cb_rtn<K extends fm.kind> =
    | fm.req<K>
    | undefined
    | null
    | void
    | false;

  export type ctx<K extends fm.kind> = fm.fetch_opts<K> & {
    ctx_req: ctx_req;
    hostname: string;
    force_retry: number;
    skip_queue: boolean;
    page_collector: { user: K[]; system: Response[] };
    pager_cb?: fm.pager_cb<K>;
    resolve: resolve;
    reject: reject;
  };
  export type fetch_fn<K extends fm.kind> = {
    execute_fetch: Function;
    get_ctx: () => ctx<K>;
  };
  export type ctx_pms<K extends fm.kind> = {
    url?: string;
    req?: Request;
    req_init?: RequestInit;
    options?: fm.fetch_opts<K>;
    pager_cb?: fm.pager_cb<K>;
  };
  export type ctx_req = {
    url?: string;
    req_init?: RequestInit;
    req?: Request;
  };
  export type limiter<K extends fm.kind> = {
    timeout_ms: number;
    hosts: { [hostname: string]: host<K> };
    reqs: limiter_reqs<K>;
    paused: limiter_paused;
    rpp: limiter_rpp;
  } & handlers<K>;
  export type limiter_reqs<K extends fm.kind> = {
    queue: fetch_fn<K>[];
    concurrency: number;
    max_concurrency: number;
    incr_concurrent: () => void;
    decr_concurrent: () => void;
    stop: () => boolean;
    why_stopped: () => string | undefined;
  };
  export type limiter_paused = {
    refr_state: () => boolean;
    set_state: (ms: number) => void;
    state: () => boolean;
    ms: number;
  };
  export type limiter_rpp = {
    period: fm.period;
    rate: number;
    max: number;
    is_throttled: () => string | undefined;
    throttle: () => boolean;
    increment: () => void;
  };
  export type host<K extends fm.kind> = {
    hostname: string;
  } & handlers<K>;
  export type resolve = (value: unknown) => void;
  export type reject = (reason?: any) => void;

  export type lib_cb<K extends fm.kind> = {
    pager: {
      [key: string]: fm.pager_cb<K> | ((...p: any[]) => fm.pager_cb<K>);
    };
    retry: {
      [key: string]: fm.resp_cb<K> | ((...p: any[]) => fm.resp_cb<K>);
    };
    timeout: {
      [key: string]: fm.resp_cb<K> | ((...p: any[]) => fm.resp_cb<K>);
    };
    response: { [key: string]: fm.resp_cb<K> };
    trace: { [key: string]: fm.trace_cb };
  };
}
/** `fetch` method overloads */
namespace f {
  export type Rs = Response;
  export type knd = fm.kind;

  type fetch_req_t<K extends fm.kind> = K extends "req"
    ? Request
    : K extends "url"
      ? string
      : never;

  export type fetch_pms<K extends fm.kind> = [
    req_url: Request | string,
    options_init_page?: RequestInit | fm.fetch_opts<K> | fm.pager_cb<K>,
    options_pager_cb?: fm.fetch_opts<K> | fm.pager_cb<K>,
    pager_cb?: fm.pager_cb<K>,
  ];

  export type r_o<K extends fm.kind> = [
    req: fetch_req_t<K>,
    options?: fm.fetch_opts<K>,
  ];
  export type r_p<K extends fm.kind> = [
    req: fetch_req_t<K>,
    pager_cb: fm.pager_cb<K>,
  ];
  export type r_o_p<K extends fm.kind> = [
    req: fetch_req_t<K>,
    options: fm.fetch_opts<K>,
    pager_cb: fm.pager_cb<K>,
  ];
  export type u_i = [url: string, init?: RequestInit];
  export type u_o<K extends fm.kind> = [
    url: fetch_req_t<K>,
    options: fm.fetch_opts<K>,
  ];
  export type u_p<K extends fm.kind> = [
    url: fetch_req_t<K>,
    pager_cb: fm.pager_cb<K>,
  ];
  export type u_o_p<K extends fm.kind> = [
    url: fetch_req_t<K>,
    options: fm.fetch_opts<K>,
    pager_cb: fm.pager_cb<K>,
  ];
  export type u_i_o<K extends fm.kind> = [
    url: fetch_req_t<K>,
    init: RequestInit,
    options: fm.fetch_opts<K>,
  ];
  export type u_i_p<K extends fm.kind> = [
    url: fetch_req_t<K>,
    init: RequestInit,
    pager_cb: fm.pager_cb<K>,
  ];
  export type u_i_o_p<K extends fm.kind> = [
    url: fetch_req_t<K>,
    init: RequestInit,
    options: fm.fetch_opts<K>,
    pager_cb: fm.pager_cb<K>,
  ];
}
