import { WebComponent } from "@frontend/components/WebComponent";
import * as lwc from "lightweight-charts";

const chart_span: period_t = [10, "y"];
const chart_granularity: period_t = [1, "d"];
const visibility_start: period_t = [1, "y"];

export class InstrumentChart extends WebComponent {
  static observedAttributes = ["id", "update"];

  constructor() {
    super();

    const { dom, style, props, handlers } = this;

    dom.template_to_self("instrmnt-chart");
    style.height = "200px";
    props.watch("id", handlers.init);
    props.watch("update", handlers.update);
  }

  private handlers = {
    init: (p: pr.prop_callback) => {
      if (p.new === p.old) return;

      InstrumentChart.charts[this.p_id] = lwc.createChart(this, {
        autoSize: true,
      });
      this.ondblclick = this.charts.set_visible_range;
    },

    update: async (p: pr.prop_callback) => {
      if (p.new === p.old) return;

      const { charts, chart } = this;
      const live_data = await this.data.fetch();

      this.baseline = this.baseline ??= charts.add_baseline_series(chart);
      this.bar = this.bar ??= charts.add_bar_series(chart);
      this.volume = this.volume ??= charts.add_volume_series(chart);

      charts.create_trade_markers();
      charts.add_buy_lines();

      charts.update_data(this.baseline, live_data.price);
      charts.update_data(this.bar, live_data.bar);
      charts.update_data(this.volume, live_data.volume);

      chart.timeScale().fitContent();
      charts.set_visible_range();
    },
  };
  private props = this.api.props();
  private dom = this.api.dom();
  private charts = {
    update_data: <T extends lwc.SeriesType>(
      series: lwc.ISeriesApi<T>,
      data: p.lwc_data[keyof p.lwc_data],
    ) => {
      if (!data.length) return;

      const ex_data = series.data();
      if (!ex_data.length) {
        series.setData(data);
        return;
      }

      const last_time = ex_data[ex_data.length - 1]!.time;
      data.forEach((d) => {
        if (d.time <= last_time) return;
        series.update(d);
      });
    },
    add_bar_series: (chart: lwc.IChartApi) => {
      const bar = chart.addSeries(lwc.BarSeries, {
        baseValue: { type: "price", price: this.data.baseline() },
        priceScaleId: "bar",
      } as p.series_options);

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
        baseValue: { type: "price", price: this.data.baseline() },
        priceScaleId: "baseline",
      } as p.series_options);

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
      } as p.series_options);
      volume.priceScale().applyOptions({
        scaleMargins: {
          top: 0.75,
          bottom: 0,
        },
      });
      return volume;
    },
    add_buy_lines: () => {
      const { data, baseline } = this;
      if (!data.buys.length) return;

      data.buys().forEach((p) =>
        baseline.createPriceLine({
          price: p.base.traded_price,
          color: util.colours.blue,
          //lineWidth: 2,
          //lineStyle: 2, // LineStyle.Dashed
          //axisLabelVisible: true,
          title: "buy",
        }),
      );
    },
    create_trade_markers: () => {
      const { positn, baseline } = this;
      const markers = positn.transctns
        .filter((t) => t.kind === "buy" || t.kind === "sell")
        .map((t) => {
          const time = Math.floor(Number(t.date) / 1000);
          const color = t.kind === "buy" ? util.colours.blue : util.colours.red;

          return {
            price: t.base.traded_price,
            color,
            position: "atPriceMiddle",
            shape: "circle",
            text: `${t.kind} ${t.base.amount}`,
            size: 1.2,
            time,
          } as lwc.SeriesMarker<lwc.Time>;
        });
      return lwc.createSeriesMarkers(baseline, markers);
    },
    set_visible_range: () => {
      const { data, chart } = this;
      chart.timeScale().setVisibleRange(data.visible_range());
    },
  };
  private data = {
    fetch: async () => {
      const { instrmnt, brokers, data } = this;
      const { saxo_id, ibkr_id } = instrmnt;

      return brokers
        .chart_data(saxo_id, ibkr_id, chart_span, chart_granularity)
        .then((d) => data.to_series(d));
    },
    to_series: (data: lv.chart_data[]) => {
      return data.reduce(
        (data, point) => {
          let { open, close, high, low, time: t, volume } = point;
          const time = t as lwc.Time;
          const color = open > close ? util.colours.red : util.colours.green;
          const value = Math.round((high * 100 + low * 100) / 2) / 100;
          data.bar.push({ close, open, high, low, time });
          data.volume.push({ time, color, value: volume });
          data.price.push({ time, value });
          return data;
        },
        { bar: [], volume: [], price: [] } as p.lwc_data,
      );
    },
    buys: () => {
      return this.positn.transctns.filter(
        (t) => t.kind === "buy" && t.base.amount > 0,
      );
    },
    baseline: () => {
      const { data } = this;
      // if (!buys.length) return 0;

      const vals = data.buys().reduce(
        (values, t) => {
          const { base, amount } = t;
          values.value += base.traded_price * amount;
          values.amount += amount;
          return values;
        },
        { value: 0, amount: 0 },
      );
      if (!vals.value || !vals.amount) return 0;
      return Math.round((vals.value * 100) / vals.amount) / 100;
    },
    visible_range: () => {
      const from = util.time.epoch.ago(visibility_start) / 1000;
      const now = util.time.ms_now() / 1000;
      return {
        from: Math.floor(from) as lwc.Time,
        to: Math.floor(now) as lwc.Time,
      };
    },
  };

  private baseline!: lwc.ISeriesApi<"Baseline">;
  private bar!: lwc.ISeriesApi<"Bar">;
  private volume!: lwc.ISeriesApi<"Histogram">;
  static charts = {} as { [p_id: id.p]: lwc.IChartApi };
  private get chart() {
    return InstrumentChart.charts[this.p_id]!;
  }
  private get positn() {
    return this.cache.get.positns()[this.p_id]!;
  }
  private get instrmnt() {
    return this.cache.get.instrmnts()[this.p_id]!;
  }
}

export { chart_granularity };

namespace p {
  export type lwc_data = {
    bar: lwc.BarData<lwc.Time>[];
    price: lwc.BaselineData<lwc.Time>[];
    volume: lwc.HistogramData<lwc.Time>[];
  };
  export type series_options = lwc.DeepPartial<
    lwc.HistogramStyleOptions & lwc.SeriesOptionsCommon
  >;
}
