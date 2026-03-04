import type { ibkr_t } from "../../../types";
import { util } from "../../../common/Util";
//import type { Cache } from "../Cache";

//type transactions_cache_t = "_ibkr_positions" | "_saxo_positions"

export class Transactions {
  constructor(private transactions: ibkr_t.transaction_t[]) {}
  map(): transaction_t {
    const transfers = this.transactions.filter((t) => t.type === "Transfer");
    const buys = this.transactions.filter((t) => t.type === "Buy");
    const buy = (buys[0] || transfers[0])!;
    const sells = this.transactions.filter((t) => t.type === "Sell");
    const position = this.transactions.reduce(
      (accum, t) => (accum += t.qty || 0),
      0,
    );
    const external_transfer = !buys.length && !sells.length;
    const open = external_transfer || position > 0;
    const account_id = transfers[transfers.length - 1]?.acctid || buy.acctid!;
    const description = util.Title_Case(buy.desc!);
    const fx_buy = buy.fxRate;
    const purchase_price = buy?.pr!;
    const date = util.date(buy?.date);

    return {
      position,
      open,
      account_id,
      description,
      fx_buy,
      purchase_price,
      date,
      external_transfer,
    };
  }
}
