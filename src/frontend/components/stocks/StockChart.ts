import { AppElement } from "@frontend/components/AppElement";
import * as lwc from "lightweight-charts";

type mapped_data_t = {
  bar: lwc.BarData<lwc.Time>[];
  price: lwc.BaselineData<lwc.Time>[];
  volume: lwc.HistogramData<lwc.Time>[];
};
type series_options_t = lwc.DeepPartial<
  lwc.HistogramStyleOptions & lwc.SeriesOptionsCommon
>;

const height = "200px";
const transition_sec = 1;
const chart_span: period_t = [10, "y"];
const chart_granularity: period_t = [1, "d"];
const visibility_start: period_t = [1, "y"];

export class StockChart extends AppElement {
  static observedAttributes = ["ticker", "ready", "drawer"];

  constructor() {
    super();
    this.dom.template_to_self("stock-chart");
    this.setAttribute("drawer", "closed");

    this.props.watch("ticker", this.handlers.fetch_data);
    this.props.watch("ready", this.handlers.render);
    this.props.watch("drawer", this.handlers.drawer);

    this.inner.style.height = height;
    this.style.height = "0";
    this.style.transition = `${transition_sec}s`;
  }

  private handlers = {
    render: async (p: p.prop_callback) => {
      if (p.old === p.new) return;

      try {
        const chart = this.dom.createChart();
        this.addEventListener("dblclick", () =>
          this.dom.set_visible_range(chart),
        );

        const baseline_chart = this.dom.add_baseline_series(chart);
        const bar_chart = this.dom.add_bar_series(chart);
        const volume_chart = this.dom.add_volume_series(chart);

        const { bar, price, volume } = this.data;

        bar_chart.setData(bar);
        baseline_chart.setData(price);
        volume_chart.setData(volume);
        this.dom.create_trade_markers(baseline_chart);
        this.dom.add_buy_lines(baseline_chart);
        this.dom.set_visible_range(chart);
      } catch (err) {
        console.error(err);
      }
    },
    fetch_data: (p: p.prop_callback) => {
      if (p.old === p.new) return;

      const { broker, con_id } = this.stock;
      return this.brokers
        .chart_data(broker, con_id, chart_span, chart_granularity)
        .then((data) => this.map_chart_data(data))
        .then((data) => {
          this.chart_data = data;
          this.setAttribute("ready", "true");
        })
        .catch((err) => console.error(err));
    },
    drawer: (p: p.prop_callback) => {
      if (p.old === p.new) return;

      if (p.new === "open") {
        this.style.height = height;
      } else {
        this.style.height = "0";
      }
    },
  };
  private props = this.api.props({});
  private dom = this.api.dom({
    createChart: () => lwc.createChart(this.inner),
    add_bar_series: (chart: lwc.IChartApi) => {
      const bar = chart.addSeries(lwc.BarSeries, {
        baseValue: { type: "price", price: this.baseline },
        priceScaleId: "bar",
      } as series_options_t);

      bar.priceScale().applyOptions({
        scaleMargins: {
          top: 0.2,
          bottom: 0.2,
        },
      });
      return bar;
    },
    add_baseline_series: (chart: lwc.IChartApi) => {
      const baseline = chart.addSeries(lwc.BaselineSeries, {
        baseValue: { type: "price", price: this.baseline },
        priceScaleId: "baseline",
      } as series_options_t);

      baseline.priceScale().applyOptions({
        scaleMargins: {
          top: 0.2,
          bottom: 0.2,
        },
      });
      return baseline;
    },
    add_volume_series: (chart: lwc.IChartApi) => {
      const volume = chart.addSeries(lwc.HistogramSeries, {
        priceFormat: {
          type: "volume",
        },
        priceScaleId: "volume",
      } as series_options_t);
      volume.priceScale().applyOptions({
        scaleMargins: {
          top: 0.75,
          bottom: 0,
        },
      });
      return volume;
    },
    add_buy_lines: (series: lwc.ISeriesApi<"Baseline">) => {
      this.buys.forEach((p) =>
        series.createPriceLine({
          price: p.price_traded!,
          color: util.colours.blue,
          //lineWidth: 2,
          //lineStyle: 2, // LineStyle.Dashed
          //axisLabelVisible: true,
          title: "buy",
        }),
      );
    },
    create_trade_markers: (series: lwc.ISeriesApi<"Baseline">) => {
      const { buys, sells } = this.stock.transactions;

      const markers = [...buys, ...sells].map((t) => {
        const time = Math.floor(Number(t.date) / 1000); //Math.floor(Number(p.date) / 1000) as Time;
        const color = t.kind === "buy" ? util.colours.blue : util.colours.red;

        return {
          price: t.price_traded,
          color,
          position: "atPriceMiddle",
          shape: "circle",
          text: `${t.kind} ${t.amount}`,
          size: 1.2,
          time,
        } as lwc.SeriesMarker<lwc.Time>;
      });
      return lwc.createSeriesMarkers(series, markers);
    },
    set_visible_range: (chart: lwc.IChartApi) => {
      chart.timeScale().setVisibleRange(this.visible_range);
    },
  });

  private get data() {
    return this.chart_data!;
  }
  private get stock() {
    if (this._stock) return this._stock;
    const stock = this.parentElement!.dataset.stock!;
    return (this._stock = JSON.parse(stock)) as stock_t<transaction_t[]>;
  }
  private get buys() {
    const { transactions } = this.stock;

    return util.money
      .aggregate_position(transactions)
      .filter((t) => t.amount > 0);
  }

  private get inner() {
    return this.querySelector("inner")! as HTMLElement;
  }

  private get baseline() {
    const buys = this.buys;
    const vals = buys.reduce(
      (c, transaction) => {
        const { price_traded, amount } = transaction;
        c.value += price_traded! * amount;
        c.amount += amount;
        return c;
      },
      { value: 0, amount: 0 },
    );
    return Math.round((vals.value * 100) / vals.amount) / 100;
  }

  private get visible_range() {
    const from = util.time.epoch_ago(visibility_start) / 1000;
    const now = util.time.ms_now() / 1000;
    return {
      from: Math.floor(from) as lwc.Time,
      to: Math.floor(now) as lwc.Time,
    };
  }
  private get currency() {
    const { buys } = this.stock.transactions;
    const { currency } = buys[0]!;
    return currency;
  }
  private get broker() {
    return this.stock.broker;
  }

  private map_chart_data = (data: chart_data_t[]) => {
    const { broker, currency } = this;
    return data.reduce(
      (c, point) => {
        let { open, close, high, low, time, volume } = point;
        // SAXO is fucking up ZAR rounding...
        if (broker === "saxo" && currency === "ZAR") {
          open = open / 100;
          close = close / 100;
          high = high / 100;
          low = low / 100;
        }
        const color = open > close ? util.colours.red : util.colours.green;
        const value = Math.round((high * 100 + low * 100) / 2) / 100;
        c.bar.push({ close, open, high, low, time });
        c.volume.push({ time, color, value: volume });
        c.price.push({ time, value });
        return c;
      },
      { bar: [], volume: [], price: [] } as mapped_data_t,
    );
  };

  private chart_data?: mapped_data_t;
  private _stock?: stock_t<transaction_t[]>;
}
