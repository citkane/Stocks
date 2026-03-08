import { Brokers, Cache } from "backend";
import type { ibkr_t, saxo_t } from "types";
import { util } from "common";

type exchanges_t = keyof typeof Position.exchanges;

export class Position {
  constructor(
    position: saxo_t.position_t | ibkr_t.position_t,
    broker: broker_t,
  ) {
    this.position =
      broker === "saxo"
        ? new Saxo(position as saxo_t.position_t)
        : new Ibkr(position as ibkr_t.position_t);
  }

  map = () => this.position.map();

  static pad_hkse_ticker(ticker: string) {
    return ticker.length < 4 ? ticker!.padStart(4, "0") : ticker;
  }

  static exchanges = {
    SEHKNTL: "sse",
    SEHKSZSE: "she",
    xssc: "sse",
    xdub: "dub",
    xhkg: "hkse",
    xsec: "she",
    xetr: "etr",
    xswx: "swx",
    xjse: "jse",
    xams: "ams",
    xmil: "mil",
    IBIS: "ibis",
    FWB2: "fwb2",
    IBIS2: "ibis2",
    "BVME.ETF": "bvme",
    SEHK: "hkse",
  };

  private position: Saxo | Ibkr;
}

class Saxo {
  constructor(private position: saxo_t.position_t) {}
  map(): position_t {
    const p = this.position;
    const d = this.details(p);

    const currency: currency_t = p.DisplayAndFormat.Currency;

    return {
      id: `saxo_${p.PositionId}`,
      original_id: p.PositionId,
      broker: "saxo",
      account_id: p.PositionBase.AccountId,
      description: d.description,
      ticker: d.ticker!,
      currency,
      exchange: d.exchange,
      position: p.PositionBase.Amount,
      fx_market: Cache.fx_pairs[currency]!,
      fx_buy: p.PositionView.ConversionRateOpen,
      date: util.date_time(p.PositionBase.ExecutionTimeOpen),
      price_market: this.price_decimal(p, p.PositionView.CurrentPrice),
      price_buy: this.price_decimal(p, p.PositionBase.OpenPrice),
    };
  }
  private details(p: saxo_t.position_t) {
    const description = util.Title_Case(p.DisplayAndFormat.Description);
    let [ticker, exchange] = p.DisplayAndFormat.Symbol.split(":");
    exchange =
      Position.exchanges[exchange! as exchanges_t] || (exchange as exchanges_t);
    if (exchange === "hkse") ticker = Position.pad_hkse_ticker(ticker!);
    return { ticker, exchange, description };
  }
  private price_decimal(p: saxo_t.position_t, price: number) {
    let decimals = p.DisplayAndFormat.Decimals;
    return decimals ? price : price / 100;
  }
}

class Ibkr {
  constructor(private position: ibkr_t.position_t) {
    this.transaction = new Transactions(
      (this.position as ibkr_t.position_t).transactions,
      this.position,
    ).map();
  }
  map(): position_t {
    const p = this.position;
    const d = this.details(p);

    const currency = p.currency as currency_t;

    return {
      id: `ibkr_${p.conid}`,
      original_id: p.conid?.toString(),
      broker: "ibkr",
      account_id: p.acctId,
      description: d.description,
      ticker: d.ticker,
      currency,
      exchange: d.exchange,
      position: p.position,
      fx_market: Cache.fx_pairs![currency]!,
      fx_buy: this.transaction?.fx_buy,
      date: this.transaction?.date,
      price_market: p.mktPrice,
      price_buy: this.transaction?.price_buy,
    };
  }

  private details(p: ibkr_t.position_t) {
    const description = util.Title_Case(p.name);
    const exchange =
      Position.exchanges[p.listingExchange as exchanges_t] || p.listingExchange;
    let ticker = p.ticker;
    if (!!ticker && exchange === "hkse")
      ticker = Position.pad_hkse_ticker(ticker!);
    return { ticker, exchange, description };
  }

  private transaction: transaction_t;
}
class Transactions {
  constructor(
    private transactions: ibkr_t.transaction_t[],
    private p: ibkr_t.position_t,
  ) {}
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
    const price_buy =
      buy.pr || Math.round(buy.amt * 100) / this.p.position / 100;
    const date = util.date_time(buy?.date);

    return {
      position,
      open,
      account_id,
      description,
      fx_buy,
      price_buy,
      date,
      external_transfer,
    };
  }
}
