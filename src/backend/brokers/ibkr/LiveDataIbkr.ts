import { Global } from "backend";

export class LiveDataIbkr extends Global {
  public fetch_chart_data = async (
    conid: string,
    period: period_t,
    granularity: period_t,
  ) => {
    const { get, fetch } = this.ibkr.api;
    const { url, req_init } = get.bar_data(
      conid,
      util.time.period.to_string(period),
      util.time.period.to_string(granularity),
    );
    return fetch<b.i.bar_data_t>(url, req_init).then((data) =>
      this.map_data(data, granularity),
    );
  };

  private map_data = (data: b.i.bar_data_t, granularity: period_t) => {
    return data.data.reduce((data, point) => {
      const { o: open, c: close, h: high, l: low, v: volume, t } = point;
      let time = util.time.period.ms_end(t, granularity);
      time = util.time.sec(time);
      data.push({ open, close, high, low, volume, time });
      return data;
    }, [] as lv.chart_data[]);
  };
}
