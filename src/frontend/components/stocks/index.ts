import { StocksRoot } from "./StocksRoot";
import { StockRow } from "./StockRow";
import { StockChart } from "./StockChart";

export { StockRow, StocksRoot, StockChart as Chart };

customElements.define("stocks-root", StocksRoot);
customElements.define("stock-row", StockRow);
customElements.define("stock-chart", StockChart);
