type context_t = "backend" | "frontend";
type topic_t = req_topic_t | set_topic_t;

type req_topic_t<T = context_t> = T extends ["frontend"]
  ? frontend.req_topic_t
  : T extends ["backend"]
    ? backend.req_topic_t
    : frontend.req_topic_t | backend.req_topic_t;
type set_topic_t<T = context_t> = T extends ["frontend"]
  ? frontend.set_topic_t
  : T extends ["backend"]
    ? backend.set_topic_t
    : frontend.set_topic_t | backend.set_topic_t;

declare global {
  namespace frontend {
    type req_topic_t = keyof frontend.Api_t["request"];
    type set_topic_t = keyof frontend.Api_t["set"];
  }
  namespace backend {
    type req_topic_t = keyof backend.Api_t["request"];
    type set_topic_t = keyof backend.Api_t["set"];
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
  constructor(private ws: ws_t) {}

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
    topic?: topic_t,
    data?: data_t,
    req_uid?: string,
    res_uid?: string,
    params?: any[],
    error?: boolean,
  ) => {
    return JSON.stringify([topic, data, req_uid, res_uid, params, error]);
  };

  request<T = context_t, D = data_t>(
    topic: req_topic_t<T>,
    data: data_t = "",
    params?: any[],
  ) {
    const req_uid = this.get_uid();
    return new Promise<message_t<T, D>>((resolve, reject) => {
      this.requests.set(req_uid, { resolve, reject });
      this.send(topic as set_topic_t, data, req_uid, undefined, params);
    });
  }
  response = (res_uid: string, data?: data_t): void => {
    this.send(undefined, data, undefined, res_uid);
  };
  send(
    topic?: topic_t,
    data?: data_t,
    req_uid?: string,
    res_uid?: string,
    params?: any[],
    error?: boolean,
  ) {
    const mssg = Messenger.encode(topic, data, req_uid, res_uid, params, error);
    this.ws.send(mssg);
  }
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
    this.send(undefined, error, undefined, uid, undefined, true);
    return;
  }

  public requests = new Map<string, resolver_t>();
  private request_id = 0;
  private get_uid() {
    this.request_id++;
    const uid = this.request_id.toString();

    return uid;
  }
}
