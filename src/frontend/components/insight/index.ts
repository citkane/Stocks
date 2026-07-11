import { InsightView, type data } from "./InsightView";
import { InsightRow } from "./InsightRow";
import { InsightRoot } from "./InsightRoot";

export { InsightView, InsightRow, InsightRoot, type data };

customElements.define("insight-root", InsightRoot);
customElements.define("insight-view", InsightView);
customElements.define("insight-row", InsightRow);
