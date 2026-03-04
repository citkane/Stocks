import { StocksRoot } from "./StocksRoot";
import { StockRow } from "./StockRow";

export { StockRow, StocksRoot };

customElements.define("stocks-root", StocksRoot);
customElements.define("stock-row", StockRow);
