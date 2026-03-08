import { MoneyString } from "./MoneyString";
import { DateString } from "./DateString";

export { MoneyString, DateString };

customElements.define("money-string", MoneyString);
customElements.define("date-string", DateString);
