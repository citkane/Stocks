import { Global } from "backend";

export class LiveDataIbkr extends Global {
  public fetch_chart_data = (...p: pr.chart_period) =>
    this.chart.fetch_data(...p);
  //public update_fx = () => this.fx.fetch_pairs();

  //private fx = {
  //  fetch_pairs: async () => {
  //    let fx = await Promise.all(this.currencies.map(this.fx.fetch_pair)).then(
  //      this.fx.merge_pairs,
  //    );
  //    Object.keys(fx).forEach((currency) => {
  //      if (!util.money.currency_minor.includes(currency)) return;
  //      switch (currency) {
  //        case "ZAC":
  //          fx.ZAC = fx.ZAR!;
  //          break;
  //        case "GBp":
  //          fx.GBp = fx.GBP!;
  //          break;
  //        case "GBX":
  //          fx.GBX = fx.GBP!;
  //          break;
  //      }
  //    });
  //    return fx;
  //  },
  //  fetch_pair: (source: string) => {
  //    const { get, fetch } = this.ibkr.api;
  //    const { url, req_init } = get.fx_rate(source, this.base_currency);
  //    return fetch<b.i.fx_rate_t>(url, req_init).then((rate) => {
  //      return { [source]: rate.rate } as fx_pair_t;
  //    });
  //  },
  //  merge_pairs: (pairs: fx_pair_t[]) => {
  //    let collector = { [this.base_currency]: 1 } as fx_rates_t;
  //    return pairs.reduce((c, pair) => {
  //      return { ...c, ...pair };
  //    }, collector);
  //  },
  //};
  private chart = {
    fetch_data: (conid: string, period: period_t, granularity: period_t) => {
      const { get, fetch } = this.ibkr.api;
      const { url, req_init } = get.bar_data(
        conid,
        util.time.period.to_string(period),
        util.time.period.to_string(granularity),
      );
      return fetch<b.i.bar_data_t>(url, req_init).then((data) =>
        this.chart.map_data(data, granularity),
      );
    },
    map_data: (data: b.i.bar_data_t, granularity: period_t) => {
      return data.data.reduce((c, point) => {
        const { o: open, c: close, h: high, l: low, v: volume, t } = point;
        let time = util.time.period.ms_end(t, granularity);
        time = util.time.sec(time);

        c.push({ open, close, high, low, volume, time });

        return c;
      }, [] as chart_data_t[]);
    },
  };

  private get currencies() {
    let currencies = this.brokers.cache.currencies;
    currencies = currencies.reduce((c, currency) => {
      if (util.money.currency_minor.includes(currency)) {
        switch (currency) {
          case "ZAC":
            c.push("ZAR");
            break;
          case "GBp":
            c.push("GBP");
            break;
          case "GBX":
            c.push("GBP");
            break;
        }
      }
      c.push(currency);
      return [...new Set(c).values()];
    }, [] as string[]);

    return currencies;
  }
}
