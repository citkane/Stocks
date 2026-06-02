import { InsightRoot } from "./InsightRoot";
import { InsightRow } from "./InsightRow";
import { InsightWrapper } from "./InsightWrapper";

export { InsightRoot, InsightRow, InsightWrapper };
export * from "./InsightHelpers";

customElements.define("insight-wrapper", InsightWrapper);
customElements.define("insight-root", InsightRoot);
customElements.define("insight-row", InsightRow);
