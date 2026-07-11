import { WebComponent } from "@frontend/components/WebComponent";
import * as lwc from "lightweight-charts";

const chart_span: period_t = [10, "y"];
const chart_granularity: period_t = [1, "d"];
const visibility_start: period_t = [1, "y"];

export class InstrumentChart extends WebComponent {
  static observedAttributes = ["init", "ready", "i_id"];

  constructor() {
    super();
    this.dom.template_to_self("instrmnt-chart");
    this.style.height = "200px";

    this.props.watch("init", this.handlers.set_i_id);
    this.props.watch("i_id", this.handlers.fetch_data);
    this.props.watch("ready", this.handlers.render);
  }

  private handlers = {
    render: async (p: pr.prop_callback) => {
      if (p.old === p.new) return;

      try {
        const chart = this.dom.createChart();
        this.addEventListener("dblclick", () =>
          this.dom.set_visible_range(chart),
        );

        const baseline_chart = this.dom.add_baseline_series(chart);
        const bar_chart = this.dom.add_bar_series(chart);
        const volume_chart = this.dom.add_volume_series(chart);

        const { bar, price, volume } = this.data.data();
        price.forEach((p) => {
          if (isNaN(Number(p.time)) || isNaN(Number(p.value))) logger.error(p);
        });

        bar_chart.setData(bar);
        volume_chart.setData(volume);
        baseline_chart.setData(price);

        this.dom.create_trade_markers(baseline_chart);
        this.dom.add_buy_lines(baseline_chart);
        this.dom.set_visible_range(chart);
      } catch (err) {
        logger.error(err);
      }
    },
    fetch_data: (p: pr.prop_callback) => {
      if (p.old === p.new) return;

      const { saxo_id, ibkr_id } = this.instrmnt;
      return this.brokers
        .chart_data(saxo_id, ibkr_id, chart_span, chart_granularity)
        .then((data) => this.data.map(data))
        .then((data) => {
          this.chart_data = data;
          this.setAttribute("ready", "true");
        })
        .catch((err) => logger.error(err));
    },
    set_i_id: () => {
      const row = this.parentElement!.parentElement!.parentElement!;
      const i_id = row.getAttribute("i_id")!;
      this.setAttribute("i_id", i_id);
    },
  };
  private props = this.api.props({});
  private dom = this.api.dom({
    createChart: () => lwc.createChart(this),
    add_bar_series: (chart: lwc.IChartApi) => {
      const bar = chart.addSeries(lwc.BarSeries, {
        baseValue: { type: "price", price: this.data.baseline() },
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
        baseValue: { type: "price", price: this.data.baseline() },
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
      this.data.buys().forEach((p) =>
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
      const { buys, sells } = this.position;

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
      chart.timeScale().setVisibleRange(this.data.visible_range());
    },
  });
  private data = {
    data: () => this.chart_data!,
    map: (data: lv.chart_data[]) => {
      return data.reduce(
        (c, point) => {
          let { open, close, high, low, time, volume } = point;
          const color = open > close ? util.colours.red : util.colours.green;
          const value = Math.round((high * 100 + low * 100) / 2) / 100;
          c.bar.push({ close, open, high, low, time });
          c.volume.push({ time, color, value: volume });
          c.price.push({ time, value });
          return c;
        },
        { bar: [], volume: [], price: [] } as mapped_data_t,
      );
    },
    buys: () => {
      return this.money.chart
        .aggregate_position(this.position)
        .filter((t) => t.amount > 0);
    },
    baseline: () => {
      const buys = this.data.buys();
      if (!buys.length) return 0;

      const vals = this.data.buys().reduce(
        (c, transaction) => {
          const { price_traded, amount } = transaction;
          c.value += price_traded! * amount;
          c.amount += amount;
          return c;
        },
        { value: 0, amount: 0 },
      );
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
  private get instrmnt() {
    return this.cache.instruments[this.p_id]!;
  }
  private get position() {
    if (this._position) return this._position;
    const transactions = this.cache.transactions[this.p_id]!;
    return (this._position = this.money.chart.position(transactions));
  }

  private chart_data?: mapped_data_t;
  private _position?: filter.positn;
}

type mapped_data_t = {
  bar: lwc.BarData<lwc.Time>[];
  price: lwc.BaselineData<lwc.Time>[];
  volume: lwc.HistogramData<lwc.Time>[];
};
type series_options_t = lwc.DeepPartial<
  lwc.HistogramStyleOptions & lwc.SeriesOptionsCommon
>;
