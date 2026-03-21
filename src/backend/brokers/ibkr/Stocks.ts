import { Global } from "backend";

const col = util.colours;

export class Stocks extends Global {
  constructor() {
    super();
  }

  public fetch_chart_data = (...p: p.chart_data) => this.chart.fetch_data(...p);
  public update_fx = () => this.fx.fetch_pairs().then(this.fx.merge_pairs);

  private fx = {
    fetch_pairs: () => {
      return Promise.all(this.currencies.map(this.fx.fetch_pair));
    },
    fetch_pair: (source: currency_t) => {
      const endpoint = this.endpoints.get.fx_rate(source, this.base_currency);
      return this.ibkr.fetch<ibkr_t.fx_rate_t>(endpoint).then((rate) => {
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
    fetch_data: (conid: string, period: period_t, bar: period_t) => {
      const endpoint = this.endpoints.get.bar_data(
        conid,
        util.string.period(period),
        util.string.period(bar),
      );
      return this.ibkr
        .fetch<ibkr_t.bar_data_t>(endpoint)
        .then(this.chart.map_data);
    },
    map_data: (data: ibkr_t.bar_data_t) =>
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
      ),
  };

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
