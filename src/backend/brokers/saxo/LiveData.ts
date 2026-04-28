import { Global } from "backend";

const bar_data_limit = 1200;
//const wss_url = "wss://live-streaming.saxobank.com/oapi/streaming/ws/connect";
const price_refresh = 30000;

export class LiveData extends Global {
  constructor() {
    super();
  }
  //public subscribe = (uics: string[]) => this.subscription.all(uics);

  public fetch_chart_data = (
    conid: string,
    period: period_t,
    granularity: period_t,
  ) => {
    const starts = period_to_starts(period, granularity, bar_data_limit);
    return Promise.all(
      starts.map((start, i) => {
        const from = util.time.epoch.to_utc(start);
        const _granularity = util.time.period.to_min(granularity);
        return this.get_bar_data(conid, from, _granularity)
          .then((data) => data.Data)
          .then((data) =>
            data.filter((p) => {
              if (!starts[i + 1]) return true;
              return util.time.ms(p.Time) < starts[i + 1]!;
            }),
          );
      }),
    )
      .then((data) => data.flat())
      .then((data) => this.map_bar_data(data, granularity));
  };

  private map_bar_data = (
    data: b.s.bar_data_t["Data"],
    granularity: period_t,
  ) => {
    return data.reduce((c, point) => {
      const {
        Open: open,
        Close: close,
        High: high,
        Low: low,
        Volume: volume,
        Time,
      } = point;
      let time = util.time.period.ms_end(Time, granularity);
      time = util.time.sec(time);

      c.push({ open, close, high, low, volume, time });

      return c;
    }, [] as chart_data_t[]);
  };

  private get_bar_data(conid: string, from: string, granularity_min: number) {
    const asset_type = "Stock";
    const endpoint = this.endpoints.get.bar_data(
      asset_type,
      conid,
      from,
      granularity_min,
    );
    return this.saxo.fetch<b.s.bar_data_t>(endpoint);
  }
  private _context?: string;

  private get context() {
    return this._context
      ? this._context
      : (this._context = this.saxo.auth.random_context());
  }

  /*
  private ws_client = {
    connect: async () => {
      if (!!this.socket) return;
      const token = this.saxo.auth.token.access_token;
      const url = `${wss_url}?contextId=${this.context}`;
      this.socket = new WebSocket(url, {
        // @ts-ignore
        headers: { Authorization: `BEARER ${token}` },
      });
      this.socket.addEventListener("open", this.ws_client.open);
      this.socket.addEventListener("message", this.ws_client.message);
      this.socket.addEventListener("close", this.ws_client.close);
      this.socket.addEventListener("error", this.ws_client.error);
    },
    error: (e: Event) => {
      // Logger not working in this scope
      console.error(e);
    },
    open: (_e: Event) => {
      logger.info("SAXO client websoket open");
    },
    close: () => {
      logger.info("SAXO client websoket closed");
    },
    message: (m: MessageEvent<Buffer>) => {
      const id_size = m.data[10]!;
      const _topic = m.data.subarray(11, id_size + 11).toString() as topic_t;
      const _data = m.data.subarray(16 + id_size).toString();

      const data = JSON.parse(_data) as message_t[];
      let [topic, id] = _topic.split("_") as [topic_t, string];
      if (!topic) topic = _topic;

      if (topic === "_heartbeat") return this.ws_client.debug_beat(data);
      if (topics.includes(topic)) this.topics[topic]({ id, data });
    },
    debug_beat: (data: message_t[]) => {
      const beats = data
        .map((d) =>
          d.Heartbeats.map((h) => h.OriginatingReferenceId).join(", "),
        )
        .join(", ");
      logger.debug(`SAXO ws heartbeat: ${beats}`);
    },
  };
  private subscription = {
    all: async (uics: string[]) => {
      this.ws_client.connect();
      this.subscription
        .prices(uics)
        .then((data) => {
          const r = { id: "", data: data.Snapshot };
          this.topics.prices(r);
        })
        .catch((err) => {
          logger.warn(err);
        });
      //uics.forEach((uic) => {
      //  this.subscription
      //    .prices(uic)
      //    .then(
      //      (data) =>
      //        data && this.topics.price({ id: "", data: data.Snapshot }),
      //    );
      //});
    },
    prices: (uics: string[]) => {
      const { url: _url, params } = this.endpoints.post.prices(uics);
      return this.saxo.fetch<{ Snapshot: { Data: price_t[] } }>(_url, params);
    },
  };
  private topics: {
    [key in Exclude<topic_t, "_heartbeat">]: (r: data_p) => void;
  } = {
    // live market data
    prices: (r: data_p<{ Data: price_t[] }>) => {
      logger.info(r);
    },
  };
  */
  private endpoints = {
    get: {
      bar_data: (
        asset_type: string,
        conid: string,
        from: string,
        granularity_min: number,
      ) => {
        const params = [
          `Mode=From`,
          `AssetType=${asset_type}`,
          `Time=${from}`,
          `Horizon=${granularity_min}`,
          `Uic=${conid}`,
          `Count=${bar_data_limit}`,
        ];
        return `${this.api_chart_url}/charts?${params.join("&")}`;
      },
    },
    post: {
      prices: (uics: string[]) => ({
        url: `${util.url.saxo.trade}/infoprices/subscriptions`,
        params: {
          method: "POST",
          headers: {
            "Content-Type": "application/json; charset=utf-8",
          },
          body: JSON.stringify({
            Arguments: {
              AssetType: "Stock,Etf",
              Uics: uics.join(","),
            },
            ContextId: this.context,
            ReferenceId: `prices`,
            RefreshRate: price_refresh,
          }),
        },
      }),
    },
  };
  private get api_chart_url() {
    return util.url.saxo.chart;
  }

  //private socket?: WebSocket;
}

function period_to_starts(
  period: period_t,
  granularity: period_t,
  max_count: number,
  starts: number[] = [],
  max_ago?: number,
  _now?: number,
): number[] {
  const params = [period, granularity, max_count, starts, max_ago] as const;
  const [now, ms_ago] = calc_ms_ago(...params, _now);

  if (ms_ago < now) {
    starts.push(ms_ago);
    return period_to_starts(...params, now);
  }

  return starts;
}

function calc_ms_ago(
  period: period_t,
  granularity: period_t,
  max_count: number,
  starts: number[] = [],
  max_ago?: number,
  now?: number,
): [number, number] {
  max_ago! = max_ago || max_ago_ms(granularity, max_count);
  now! = now || util.time.ms_now();

  const last_start = starts[starts.length - 1];
  const ms_ago = !last_start
    ? now - util.time.period.to_ms(period)
    : last_start + max_ago;

  return [now, ms_ago];
}

function max_ago_ms(granularity: period_t, max_count: number) {
  const granularity_ms = util.time.period.to_ms(granularity);
  return granularity_ms * max_count;
}

/*
const topics = ["prices", "_heartbeat"] as const;
type topic_t = (typeof topics)[number];
type data_t<T = any> = T;
type message_t = {
  ReferenceId: string;
  Heartbeats: { OriginatingReferenceId: string; Reason: string }[];
} & { [key: string]: any };
type data_p<T = any> = { id?: string; data: data_t<T> };

type price_t = {
  AssetType: string;
  LastUpdated: string;
  PriceSource: string;
  Quote: {
    Amount: number;
    Ask: number;
    AskSize: number;
    Bid: number;
    BidSize: number;
    DelayedByMinutes: number;
    ErrorCode: string;
    MarketState: string;
    Mid: number;
    PriceSource: string;
    PriceSourceType: string;
    PriceTypeAsk: string;
    PriceTypeBid: string;
  };
  Uic: number;
};
*/
