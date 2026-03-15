import { Global } from "backend";

const col = util.colours;

export default class Stocks extends Global {
  public bar_data(conid: string, period: string, bar: string) {
    const endpoint = this.endpoints.get.bar_data(conid, period, bar);
    return this.ibkr.fetch<ibkr_t.bar_data_t>(endpoint);
  }
  public map_bar_data = (data: ibkr_t.bar_data_t["data"]) =>
    data.reduce(
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
