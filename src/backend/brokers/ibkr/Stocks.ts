import { Global } from "backend";

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
