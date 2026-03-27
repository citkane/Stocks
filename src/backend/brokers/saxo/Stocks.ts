import { Global } from "backend";

const bar_data_limit = 1200;

export class Stocks extends Global {
  constructor() {
    super();
  }
  public fetch_chart_data = (
    conid: string,
    period: period_t,
    granularity: period_t,
  ) => {
    const starts = period_to_starts(period, granularity, bar_data_limit);
    return Promise.all(
      starts.map((start, i) => {
        const from = util.string.epoch_to_utc(start);
        const _granularity = util.time.period_to_min(granularity);
        return this.get_bar_data(conid, from, _granularity)
          .then((data) => {
            logger.json("SAXO raw stock data", data);
            return data.Data;
          })
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
      let time = util.time.ms_period_end(Time, granularity);
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
    post: {},
  };
  private get api_chart_url() {
    return util.url.saxo.chart;
  }
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
    ? now - util.time.period_to_ms(period)
    : last_start + max_ago;

  return [now, ms_ago];
}

function max_ago_ms(granularity: period_t, max_count: number) {
  const granularity_ms = util.time.period_to_ms(granularity);
  return granularity_ms * max_count;
}
