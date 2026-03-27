type context_t = "backend" | "frontend";
type topic_t =
  | req_topic_t<"frontend">
  | send_topic_t<"frontend">
  | req_topic_t<"backend">
  | send_topic_t<"backend">
  | typeof undefined;

type req_topic_t<T = context_t> = T extends "frontend"
  ? frontend.req_topic_t
  : T extends "backend"
    ? backend.req_topic_t
    : never;
type send_topic_t<T = context_t> = T extends "frontend"
  ? frontend.send_topic_t
  : T extends "backend"
    ? backend.send_topic_t
    : never;

declare global {
  namespace frontend {
    type req_topic_t = keyof frontend.Api_t["requests"];
    type send_topic_t = keyof frontend.Api_t["setter"];
  }
  namespace backend {
    type req_topic_t = keyof backend.Api_t["requests"];
    type send_topic_t = keyof backend.Api_t["setter"];
  }

  type message_t<T = context_t, D = data_t> = {
    topic: req_topic_t<T>;
    data: D;
    req_uid?: string;
    res_uid?: string;
    params?: string[];
    error?: boolean;
  };

  type req_t = {
    messenger: Messenger;
    req_uid: string;
  };
}
export class Messenger {
  constructor(
    private ws: ws_t,
    private _context: context_t,
  ) {}

  static decode = <T = context_t, D = data_t>(
    message: string,
  ): message_t<T, D> => {
    const mssg_array = JSON.parse(message) as [
      req_topic_t<T>,
      D,
      string?,
      string?,
      string[]?,
      boolean?,
    ];
    const [topic, data, req_uid, res_uid, params, error] = mssg_array;
    return {
      topic,
      data,
      req_uid,
      res_uid,
      params,
      error,
    };
  };
  static encode = (
    topic: topic_t,
    data?: data_t,
    req_uid?: string,
    res_uid?: string,
    params?: any[],
    error?: boolean,
  ) => {
    return JSON.stringify([topic, data, req_uid, res_uid, params, error]);
  };

  request = <D = data_t>(
    topic: req_topic_t<typeof this.context>,
    data: data_t = "",
    params?: any[],
  ) => {
    const req_uid = this.get_uid();
    return new Promise<D>((resolve, reject) => {
      this.requests.set(req_uid, { resolve, reject });
      this.send(topic as send_topic_t, data, req_uid, undefined, params);
    });
  };
  send = <T = typeof this.context>(
    topic: send_topic_t<T>,
    data?: data_t,
    req_uid?: string,
    res_uid?: string,
    params?: any[],
    error?: boolean,
  ) => {
    const mssg = Messenger.encode(topic, data, req_uid, res_uid, params, error);
    this.ws.send(mssg);
  };
  response = (res_uid: string, data?: data_t): void => {
    this.send(undefined as any as send_topic_t, data, undefined, res_uid);
  };
  error(uid: string, res: Response): void;
  error(uid: string, status: number, statusText: any): void;
  error(uid: string, res_status: Response | number, statusText?: string) {
    let error: res_error_t;
    if (!!statusText) {
      const res = statusText as unknown as Response;
      if (res instanceof Response) return this.error(uid, res);
      const status = res_status as number;
      statusText =
        typeof statusText === "object"
          ? (statusText as Object).toString()
          : statusText;
      error = { status, statusText };
    } else {
      const { status, statusText } = res_status as Response;
      error = { status, statusText };
    }
    //console.error(`Response ${uid}:`, error);
    this.send(
      undefined as any as send_topic_t,
      error,
      undefined,
      uid,
      undefined,
      true,
    );
    return;
  }

  public requests = new Map<string, resolver_t>();
  private get context() {
    return (this._context === "backend" ? "frontend" : "backend") as context_t;
  }
  private request_id = 0;
  private get_uid() {
    this.request_id++;
    return this.request_id.toString();
  }
}
