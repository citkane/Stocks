import { InstrumentChart } from "./InstrumentChart.ts";
import { InstrumentRow } from "./InstrumentRow.ts";
import { InstrumentsRoot } from "./InstrumentsRoot.ts";

export { InstrumentRow, InstrumentChart, InstrumentsRoot };
export { chart_granularity } from "./InstrumentChart.ts";

customElements.define("instrmnts-root", InstrumentsRoot);
customElements.define("instrmnt-row", InstrumentRow);
customElements.define("instrmnt-chart", InstrumentChart);
