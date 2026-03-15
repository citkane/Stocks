import { AppElement } from "@frontend/components/AppElement";
import {
  BarSeries,
  BaselineSeries,
  CandlestickSeries,
  createChart,
  createSeriesMarkers,
  HistogramSeries,
  type DeepPartial,
  type HistogramStyleOptions,
  type IChartApi,
  type ISeriesApi,
  type SeriesMarker,
  type SeriesOptionsCommon,
  type Time,
} from "lightweight-charts";

type series_options_t = DeepPartial<
  HistogramStyleOptions & SeriesOptionsCommon
>;

const height = "200px";
const transition_sec = 1;
const chart_span: period_t = [10, "y"];
const chart_granularity: period_t = [1, "d"];
const visibility_start: period_t = [1, "y"];

export class StockChart extends AppElement {
  static observedAttributes = ["state"];

  constructor() {
    super();
    this.dom.template_to_self("stock-chart");
    this.props.watch("state", this.handlers.render);

    this.inner.style.height = height;
    this.style.height = "0";
    this.style.transition = `${transition_sec}s`;

    this.addEventListener("dblclick", this.dom.set_visible_range);
  }

  private handlers = {
    render: async (old_value: string, new_value: string) => {
      if (old_value === new_value) return;
      if (new_value === "closed") {
        this.style.height = "0";
        this.chart?.remove();
        return;
      }
      this.style.height = height;
      this.chart = this.dom.createChart();
      const baseline = this.dom.add_baseline_series();
      const bar = this.dom.add_bar_series();
      const volume = this.dom.add_volume_series();

      const data = await this.data;
      bar.setData(data.bar);
      baseline.setData(data.price);
      volume.setData(data.volume);
      this.dom.create_buy_markers(baseline);
      this.dom.add_buy_lines(baseline);

      this.dom.set_visible_range();
    },
  };
  private props = this.api.props({});
  private dom = this.api.dom({
    createChart: () => createChart(this.inner),
    add_bar_series: () => {
      const bar = this.chart!.addSeries(BarSeries, {
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
    add_baseline_series: () => {
      const baseline = this.chart!.addSeries(BaselineSeries, {
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
    add_volume_series: () => {
      const volume = this.chart!.addSeries(HistogramSeries, {
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
    add_buy_lines: (series: ISeriesApi<"Baseline">) => {
      this.stock.positions.forEach((p) =>
        series.createPriceLine({
          price: p.price_buy,
          color: util.colours.blue,
          //lineWidth: 2,
          //lineStyle: 2, // LineStyle.Dashed
          //axisLabelVisible: true,
          title: "buy",
        }),
      );
    },
    create_buy_markers: (series: ISeriesApi<"Baseline">) => {
      const markers = [...this.stock.positions].map((p) => {
        const time = Math.floor(Number(p.date) / 1000); //Math.floor(Number(p.date) / 1000) as Time;
        console.log(time);

        return {
          price: p.price_buy,
          color: util.colours.blue,
          position: "atPriceMiddle",
          shape: "circle",
          text: `buy ${p.position}`,
          size: 1.2,
          time,
        } as SeriesMarker<Time>;
      });
      return createSeriesMarkers(series, markers);
    },
    set_visible_range: () => {
      this.chart?.timeScale().setVisibleRange(this.visible_range);
    },
  });

  private get stock() {
    return this.cache.get.stock(this.ticker)!;
  }
  private get ticker() {
    return this.getAttribute("ticker")!;
  }
  private get inner() {
    return this.querySelector("inner")! as HTMLElement;
  }

  private get baseline() {
    const buy = [...this.stock.positions].reduce(
      (c, p) => {
        const [value, position] = c;
        c = [value! + p.price_buy * p.position, position! + p.position];
        return c;
      },
      [0, 0],
    );
    const [value, position] = buy;
    return Math.round((value! * 100) / position!) / 100;
  }
  private get data() {
    return this.chart_data
      ? Promise.resolve(this.chart_data)
      : this.brokers
          .chart_data(
            this.stock.broker,
            this.stock.con_id,
            chart_span,
            chart_granularity,
          )
          .then((res) => res.data)
          .then((data) => (this.chart_data = data));
  }
  private get visible_range() {
    return {
      from: util.time.epoch_ago<Time>(visibility_start, true),
      to: util.time.ms_now<Time>(true),
    };
  }

  private chart?: IChartApi;
  private chart_data?: stock_data_t;
}
