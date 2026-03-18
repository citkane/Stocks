import { Global } from "backend";

const col = util.colours;

export class Stocks extends Global {
  public chart_data(conid: string, period: period_t, bar: period_t) {
    const endpoint = this.endpoints.get.bar_data(
      conid,
      util.string.period(period),
      util.string.period(bar),
    );
    return this.ibkr.fetch<ibkr_t.bar_data_t>(endpoint).then(this.map_bar_data);
  }

  private map_bar_data = (data: ibkr_t.bar_data_t) =>
    data.data.reduce(
      (c, point) => {
        const time = util.time.ms_day_end(point.t, true);
        c.bar.push({
          open: point.o,
          close: point.c,
          high: point.h,
          low: point.l,
          time,
        });
        c.volume.push({
          color: point.c > point.o ? col.green : col.red,
          value: point.v,
          time,
        });
        c.price.push({
          value: point.c,
          time,
        });
        return c;
      },
      { bar: [], volume: [], price: [] } as stock_data_t,
    );

  private endpoints = {
    get: {
      bar_data: (conid: string, period: string, granularity: string) => {
        const params = [
          `conid=${conid}`,
          `period=${period}`,
          `bar=${granularity}`,
        ].join("&");

        return `iserver/marketdata/history?${params}`;
      },
    },
    post: {},
  };
}
