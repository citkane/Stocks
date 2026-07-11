import { MoneyString } from "./MoneyString";
import { PercentString } from "./PercentString";
import { DateString } from "./DateString";
import { AnyString } from "./AnyString";
import { ExpandingDrawer } from "./ExpandingDrawer";

export { MoneyString, DateString, AnyString, ExpandingDrawer, PercentString };

customElements.define("money-str", MoneyString);
customElements.define("percent-str", PercentString);
customElements.define("date-str", DateString);
customElements.define("any-str", AnyString);
customElements.define("expanding-drawer", ExpandingDrawer);
