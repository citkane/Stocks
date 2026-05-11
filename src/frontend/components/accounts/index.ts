import { AccountsRoot } from "./AccountsRoot";
import { AccountsBroker } from "./AccountsBroker";
import { AccountRow } from "./AccountRow";
import { BalanceRow } from "./BalanceRow";

export { AccountsBroker, AccountsRoot, AccountRow, BalanceRow };

customElements.define("accounts-root", AccountsRoot);
customElements.define("accounts-broker", AccountsBroker);
customElements.define("account-row", AccountRow);
customElements.define("balance-row", BalanceRow);
