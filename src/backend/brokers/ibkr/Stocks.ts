import { Global } from "backend";

const col = util.colours;

export class Stocks extends Global {
  constructor() {
    super();
  }
  public fx_rate = (source: currency_t) => {
    const { base_currency } = this.brokers;
    const endpoint = this.endpoints.get.fx_rate(source, base_currency);
    return this.ibkr.fetch<ibkr_t.fx_rate_t>(endpoint).then((rate) => {
      return { [source]: rate.rate };
    });
  };
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
}
