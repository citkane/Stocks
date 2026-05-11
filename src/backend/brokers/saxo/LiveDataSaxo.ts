import { Global } from "backend";

const bar_data_limit = 1200;

export class LiveDataSaxo extends Global {
  public fetch_chart_data = async (
    conid: string,
    period: period_t,
    granularity: period_t,
  ) => {
    const starts = period_to_starts(period, granularity, bar_data_limit);
    const _granularity = util.time.period.to_min(granularity);
    const _data = await Promise.all(
      starts.map((start, i) => {
        const from = util.time.epoch.to_utc(start);
        return this.get_bar_data(conid, from, _granularity, starts, i);
      }),
    );
    const data = _data.flat();
    return this.map_bar_data(data, granularity);
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

  private get_bar_data = async (
    conid: string,
    from: string,
    granularity_min: number,
    starts: number[],
    i: number,
  ) => {
    const asset_type = "Stock";
    const endpoint = this.saxo.endpoints.get.bar_data(
      asset_type,
      conid,
      from,
      granularity_min,
      bar_data_limit,
    );
    const data = (await this.saxo.fetch<b.s.bar_data_t>(endpoint)).Data;
    return data.filter((p) => {
      if (!starts[i + 1]) return true;
      return util.time.ms(p.Time) < starts[i + 1]!;
    });
  };
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
