import { Global } from "backend";

const wss_url = "wss://localhost:5000/v1/api/ws";

export class LiveData extends Global {
  constructor() {
    super();
  }

  public fetch_chart_data = (...p: p.chart_period) =>
    this.chart.fetch_data(...p);
  public update_fx = () => this.fx.fetch_pairs().then(this.fx.merge_pairs);
  //public subscribe = () => this.ws_client.connect();

  private fx = {
    fetch_pairs: () => {
      return Promise.all(this.currencies.map(this.fx.fetch_pair));
    },
    fetch_pair: (source: currency_t) => {
      const endpoint = this.endpoints.get.fx_rate(source, this.base_currency);
      return this.ibkr.fetch<b.i.fx_rate_t>(endpoint).then((rate) => {
        return { [source]: rate.rate } as fx_pair_t;
      });
    },
    merge_pairs: (pairs: fx_pair_t[]) => {
      let collector = { [this.base_currency]: 1 } as fx_rates_t;
      return pairs.reduce((c, val) => {
        return { ...c, ...val };
      }, collector);
    },
  };
  private chart = {
    fetch_data: (conid: string, period: period_t, granularity: period_t) => {
      const endpoint = this.endpoints.get.bar_data(
        conid,
        util.string.period(period),
        util.string.period(granularity),
      );
      return this.ibkr
        .fetch<b.i.bar_data_t>(endpoint)
        .then((data) => this.chart.map_data(data, granularity));
    },
    map_data: (data: b.i.bar_data_t, granularity: period_t) => {
      return data.data.reduce((c, point) => {
        const { o: open, c: close, h: high, l: low, v: volume, t } = point;
        let time = util.time.ms_period_end(t, granularity);
        time = util.time.sec(time);

        c.push({ open, close, high, low, volume, time });

        return c;
      }, [] as chart_data_t[]);
    },
  };
  /*
  private ws_client = {
    connect: async () => {
      if (!!this.socket) return;
      const token = await this.ibkr.auth.session_token();
      this.socket = new WebSocket(wss_url, {
        // @ts-ignore
        tls: { rejectUnauthorized: false },
        headers: { cookie: `api=${token}` },
      });
      this.socket.addEventListener("open", this.ws_client.open);
      this.socket.addEventListener("close", this.ws_client.close);
      this.socket.addEventListener("error", this.ws_client.error);
      this.socket.addEventListener("message", this.ws_client.message);
    },
    error: (e: Event) => {
      // Logger not working in this scope
      console.error(e);
    },
    open: (_e: Event) => {
      logger.info("IBKR client websoket open");
    },
    close: (_e: Event) => {
      logger.info("IBKR client websoket closed");
    },
    message: (m: MessageEvent<Buffer>) => {
      const str = m.data.toString();
      const message: message_t = JSON.parse(str);
      let { topic, args, result, error } = message;
      if (error) {
        logger.warn("IBKR WS error", message);
        return;
      }

      const [_topic, id] = topic.split("+") as [topic_t, string];
      const data = result || args || message;
      if (topics.includes(_topic)) this.topics[_topic]({ id, data });
    },
  };

  private topics: {
    [key in Exclude<topic_t, "system">]: (r: data_p) => void;
  } = {
    // live market data
    smd: (r: data_p) => {
      let { "31": price, "7671": dividend } = r.data;
      price = !price ? price : Number(price);
      dividend = !dividend ? dividend : Number(dividend);
    },
    // accounts summary
    act: (r: data_p<{ accounts: string[] }>) => {
      //this.socket?.send(`smd+81351030+{"fields":["31","7671"]}`);

      const a_ids = r.data.accounts.filter((a) => a !== "All");
      const key_vals = {
        keys: [
          "AvailableFunds",
          "TotalCashValue",
          "GrossPositionValue",
          "NetLiquidation",
        ],
        fields: ["currency", "monetaryValue"],
      };
      //a_ids.forEach((a_id) =>
      //this.socket?.send(`ssd+${a_id}+${JSON.stringify(key_vals)}`),
      //this.socket?.send(`sld+${a_id}`),
      //);
      //logger.info(a_ids);
    },
    // account data
    ssd: (r: data_p<{ [key: string]: any }[]>) => {
      let currency: string | undefined = undefined;
      let data = r.data.reduce(
        (c, item) => {
          let { key } = item;
          delete item.key;
          delete item.timestamp;
          delete item.severity;
          if (item.currency && !currency) currency = item.currency;
          if (item.currency === currency) delete item.currency;
          if (!Object.keys(item).length) return c;
          if (item.monetaryValue === 0) return c;
          if (item.value === "" || item.value === "0") return c;
          if (Object.keys(item).length === 1)
            item = item[Object.keys(item)[0]!];

          c[key] = item;
          return c;
        },
        {} as { [key: string]: {} | string | number },
      );
      if (currency) data.currency = currency;
    },
    // account ledger
    sld: (r: data_p) => {
      logger.info(r.id, r.data);
    },
  };
*/
  private endpoints = {
    get: {
      fx_rate: (source: currency_t, target: currency_t) => {
        return `${this.api_url}/iserver/exchangerate?Source=${source}&Target=${target}`;
      },
      bar_data: (conid: string, period: string, granularity: string) => {
        const params = [
          `conid=${conid}`,
          `period=${period}`,
          `bar=${granularity}`,
        ].join("&");

        return `${this.api_url}/iserver/marketdata/history?${params}`;
      },
    },
    post: {},
  };
  private get api_url() {
    return util.url.ibkr.api;
  }
  //private socket?: WebSocket;
}

/*
const topics = ["act", "ssd", "sld", "smd"] as const;

type topic_t = (typeof topics)[number];
type data_t<T = any> = T;

type message_t = {
  error: boolean;
  topic: topic_t;
  args?: data_t;
  result?: data_t;
};
type data_p<T = any> = { id?: string; data: data_t<T> };
*/
//type data_acc_t = {
//  key: string;
//  currency: string;
//  monetaryValue: number;
//  severity: number;
//  timestamp: number;
//};
