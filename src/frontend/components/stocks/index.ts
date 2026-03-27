import { StocksRoot } from "./StocksRoot";
import { StockRow } from "./StockRow";
import { StockChart } from "./StockChart";
import { SelectBroker } from "./SelectBroker";
import { SelectAccount } from "./SelectAccount";

export { StockRow, StocksRoot, StockChart as Chart };

customElements.define("stocks-root", StocksRoot);
customElements.define("stock-row", StockRow);
customElements.define("stock-chart", StockChart);
customElements.define("select-broker", SelectBroker);
customElements.define("select-account", SelectAccount);
