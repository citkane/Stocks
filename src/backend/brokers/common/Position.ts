import { Global } from "backend";

type exchanges_t = keyof typeof exchanges;

const exchanges = {
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

function pad_hkse_ticker(ticker: string) {
  return ticker.length < 4 ? ticker!.padStart(4, "0") : ticker;
}

export class SaxoPosition extends Global {
  constructor(private position: saxo_t.position_t) {
    super();
  }
  map(): position_t {
    const p = this.position;
    const d = this.details(p);

    const { ExecutionTimeOpen, ValueDate } = p.PositionBase;
    const _date =
      ExecutionTimeOpen.split("T")[0] === ValueDate.split("T")[0]
        ? ExecutionTimeOpen
        : ValueDate;

    const p_id = `saxo_${p.PositionId}`;
    const con_id = p.PositionBase.Uic.toString();
    const a_id = p.PositionBase.AccountId;
    const position = p.PositionBase.Amount;
    const currency: currency_t = p.DisplayAndFormat.Currency;
    const fx_market = this.cache.fx_pairs[currency]!;
    const fx_buy = p.PositionView.ConversionRateOpen;
    const date = util.time.ms(_date);
    const price_market = this.price_decimal(p, p.PositionView.CurrentPrice);
    const price_buy = this.price_decimal(p, p.PositionBase.OpenPrice);

    return {
      p_id,
      con_id,
      broker: "saxo",
      a_id,
      description: d.description,
      ticker: d.ticker!,
      currency,
      exchange: d.exchange,
      position,
      fx_market,
      fx_buy,
      date,
      price_market,
      price_buy,
    };
  }
  private details(p: saxo_t.position_t) {
    const description = util.string.title_case(p.DisplayAndFormat.Description);
    let [ticker, exchange] = p.DisplayAndFormat.Symbol.split(":");
    exchange = exchanges[exchange! as exchanges_t] || (exchange as exchanges_t);
    if (exchange === "hkse") ticker = pad_hkse_ticker(ticker!);
    return { ticker, exchange, description };
  }
  private price_decimal(p: saxo_t.position_t, price: number) {
    let decimals = p.DisplayAndFormat.Decimals;
    return decimals ? price : price / 100;
  }
}

export class IbkrPositions {
  constructor(
    //private transactions: ibkr_t.transaction_t[],
    private p: ibkr_t.position_t,
  ) {
    this.positions = this.buys.map(
      (buy, i) =>
        new IbkrPosition(
          this.p,
          i,
          buy.fxRate,
          util.time.ms(buy.date),
          buy.pr!,
        ),
    );
  }
  public positions: IbkrPosition[];

  private get transfers() {
    return this.p.transactions.filter(
      (t) => t.type === "Transfer", //&& t.acctid === this.account_id,
    );
  }
  private get buys() {
    return this._buys ? this._buys : this.calculate_buys();
  }
  private get sells() {
    return this.p.transactions.filter((t) => t.type === "Sell");
  }

  private calculate_buys() {
    let _buys = this.p.transactions.filter((t) => t.type === "Buy");
    const { sells } = this;
    if (!sells.length)
      return (this._buys = [..._buys, ...this.find_transfer_buys()]);

    _buys = structuredClone(_buys);

    return (this._buys = [
      ...sells
        .sort((a, b) => b.qty! - a.qty!)
        .reduce((a, sell) => {
          const sell_buys = this.narrow_buys_for_sell(sell, _buys);
          return [...a, ...this.subtract_sell_from_buys(sell, sell_buys)];
        }, [] as ibkr_t.transaction_t[]),
      ...this.find_transfer_buys(),
    ]);
  }
  private find_transfer_buys() {
    const transfers = structuredClone(this.transfers).map((t) => {
      const qty_str = t.desc.split(":").pop()!.replaceAll(",", "");
      t.qty = Number(qty_str);
      t.pr = Math.floor(t.amt * 100) / t.qty / 100;
      return t;
    });
    const transfer_out = transfers.filter((t) => t.qty! < 0);
    const transfer_in = transfers
      .filter((t) => t.qty! > 0)
      .filter((t_i) => {
        return !transfer_out.find((t_o, i) => {
          const found = t_o.date === t_i.date && Math.abs(t_o.qty!) === t_i.qty;
          if (found) transfer_out.splice(i, 1);
          return found;
        });
      });
    return transfer_in;
  }
  private subtract_sell_from_buys(
    sell: ibkr_t.transaction_t,
    mutable_buys: ibkr_t.transaction_t[],
  ) {
    let sold = Math.abs(sell.qty!);
    return mutable_buys
      .map((bought) => {
        if (bought.qty! >= sold) {
          bought.qty = bought.qty! - sold;
        } else {
          sold = sold - bought.qty!;
          bought.qty = 0;
        }
        return bought;
      })
      .filter((b) => b.qty! > 0);
  }

  private narrow_buys_for_sell(
    sell: ibkr_t.transaction_t,
    buys: ibkr_t.transaction_t[],
  ) {
    const sell_date = util.time.ms(sell.date);
    return (
      buys?.filter((buy) => {
        const buy_date = util.time.ms(buy.date);
        const is_later = sell_date >= buy_date;
        const is_affordable = Math.abs(sell.qty!) <= buy.qty!;
        return is_later && is_affordable;
      }) || []
    );
  }
  private _buys?: ibkr_t.transaction_t[];
}

class IbkrPosition extends Global {
  constructor(
    private position: ibkr_t.position_t,
    private index: number,
    private fx_buy: number,
    private date: number,
    private price_buy: number,
  ) {
    super();
  }
  map(): position_t {
    const p = this.position;
    const d = this.details(p);

    const currency = p.currency as currency_t;
    const { conid } = p;
    const { index: id, fx_buy, date, price_buy } = this;

    return {
      p_id: `ibkr_${conid}_${id}`,
      con_id: `${conid}`,
      broker: "ibkr",
      a_id: p.acctId,
      description: d.description,
      ticker: d.ticker,
      currency,
      exchange: d.exchange,
      position: p.position,
      fx_market: this.cache.fx_pairs![currency]!,
      fx_buy,
      date,
      price_market: p.mktPrice,
      price_buy,
    };
  }

  private details(p: ibkr_t.position_t) {
    const description = util.string.title_case(p.name);
    const exchange =
      exchanges[p.listingExchange as exchanges_t] || p.listingExchange;
    let ticker = p.ticker;
    if (!!ticker && exchange === "hkse") ticker = pad_hkse_ticker(ticker!);
    return { ticker, exchange, description };
  }
}
