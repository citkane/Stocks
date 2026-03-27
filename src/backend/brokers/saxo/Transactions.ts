import { Global } from "backend";

const { client_key } = conf.saxo;

const deep_mapped = ["Buy", "Sell", "Final Maturity"] as const;

type deep_key_t = (typeof deep_mapped)[number];
type shallow_key_t = Exclude<events_t, deep_key_t>;
type mapped_t = b.s.transaction_t[];
type deep_mapped_t = {
  [key: string]: { [key in "buy" | "sell"]: flattened_t[] };
};
type events_t = b.s.transaction_t["Event"];
type mapped_transactions_t = {
  [key in events_t | "trades"]: key extends "trades" ? deep_mapped_t : mapped_t;
};
type flattened_t = ReturnType<typeof flatten_transaction>;

class Transaction extends Global {
  public transform(transactions: b.s.transaction_t[]) {
    logger.json("SAXO transactions raw", transactions);

    let mapped_transactions = map_transactions(transactions);
    logger.json("SAXO transactions mapped", mapped_transactions);

    const { trades } = mapped_transactions;
    const positions = flatten_to_positions(trades);
    logger.json("SAXO transactions flattened", positions);

    return positions;
  }
}

export class Transactions extends Transaction {
  public update = (
    skip = 0,
    transactions: b.s.transaction_t[] = [],
  ): Promise<b.s.transaction_t[]> => {
    const query = this.endpoints.transactions(skip);
    return this.saxo.fetch<b.s.transactions_t>(query).then((data) => {
      const count = data.Data.length;
      return count > 0
        ? this.update(skip + count, [...transactions, ...data.Data])
        : [...transactions, ...data.Data];
    });
  };

  private endpoints = {
    transactions: (skip: number) => {
      const transaction_types = "All";

      const params = [
        `FromDate=${conf.saxo.start_date}`,
        `ToDate=${util.string.epoch_to_iso_date()}`,
        `TransactionType=${transaction_types}`,
        `ClientKey=${client_key}`,
        `$skip=${skip}`,
      ].join("&");
      return `${this.api_url}/transactions?${params}`;
    },
  };
  private get api_url() {
    return util.url.saxo.history;
  }
}

function map_transactions(transactions: b.s.transaction_t[]) {
  return transactions.reduce((c, transaction) => {
    const { Event } = transaction;
    if (deep_mapped.includes(Event as any)) {
      const e = Event === "Buy" ? "buy" : "sell";
      const _transaction = flatten_transaction(transaction);
      const { Uic } = _transaction;

      if (!c.trades) c.trades = {} as deep_mapped_t;
      if (!c.trades[Uic]) c.trades[Uic] = {} as deep_mapped_t[typeof Uic];
      const container = c.trades[Uic];
      if (!container.buy) container.buy = [] as flattened_t[];
      if (!container.sell) container.sell = [] as flattened_t[];

      container[e].push(_transaction);
    } else {
      if (!c[Event]) c[Event as shallow_key_t] = [] as mapped_t;
      const container = c[Event as shallow_key_t];
      container.push(transaction);
    }

    return c;
  }, {} as mapped_transactions_t);
}

function flatten_to_positions(trades: mapped_transactions_t["trades"]) {
  return Object.keys(trades).reduce((c, Uic) => {
    const { buy, sell } = trades[Uic]!;
    const _buy = transfer_ids(buy).filter((b) => b.OriginalTradeId === 0);
    const _sell = sell.filter((s) => s.OriginalTradeId === 0);

    const positions = [..._buy, ..._sell].map((trade) => to_position(trade));
    return [...c, ...positions];
  }, [] as position_t[]);

  function to_position(trade: flattened_t) {
    const {
      Description,
      Event,
      price: price_traded,
      amount: position,
      ConversionRate: fx_traded,
      Currency: currency,
      ticker: _ticker,
      symbol,
      time: date,
      PositionId: p_id,
      Uic,
      AccountId: a_id,
    } = trade;

    let kind = "buy";
    switch (Event) {
      case "Final Maturity":
        kind = "sell";
        break;
      case "Sell":
        kind = "sell";
        break;
      case "Cash Dividend":
        kind = "dividend";
    }

    const { ticker, exchange, description } = util.string.format_ticker(
      symbol as exchanges_t,
      _ticker,
      Description,
    );

    return {
      p_id: `saxo_${p_id}`,
      con_id: Uic.toString(),
      price_traded,
      amount: position,
      fx_traded,
      currency,
      date,
      ticker,
      exchange,
      description,
      kind: kind as position_t["kind"],
      broker: "saxo",
      a_id,
    } as position_t;
  }
  function transfer_ids(trades: flattened_t[]) {
    return trades.map((trade) => {
      if (trade.OriginalTradeId > 0) return trade;
      trade = structuredClone(trade);
      const ids = find_buy_ids(trade, trades);
      trade.PositionId = ids.PositionId;
      trade.AccountId = ids.AccountId;
      return trade;
    });
  }
  function find_buy_ids(buy: flattened_t, buys: flattened_t[]) {
    const { TradeId } = buy;
    const transfer = buys.find((t) => TradeId === t.OriginalTradeId.toString());
    if (!transfer) {
      const { PositionId, AccountId } = buy;
      return { PositionId, AccountId };
    }
    return find_buy_ids(transfer, buys);
    //if (!!transfer.RelatedTradeId) return find_buy_pid(transfer, buys);
    //return transfer.PositionId;
  }
}
function flatten_transaction(transaction: b.s.transaction_t) {
  const {
    Event,
    ConversionRate,
    Date,
    OriginalTradeId,
    PositionId,
    RelatedPositionId,
    RelatedTradeId,
    TradeId,
    Instrument,
    Trades,
    AccountId,
  } = transaction;
  const { Uic, Currency, Symbol, Description } = Instrument;

  const { price, amount, time } = reduce_trades(Trades, Currency);
  const [ticker, symbol] = Symbol.split(":");

  return {
    Description,
    Event,
    price,
    amount,
    time,
    ConversionRate,
    Currency,
    ticker: ticker!,
    symbol: symbol!,
    OriginalTradeId,
    PositionId,
    RelatedPositionId,
    RelatedTradeId,
    TradeId,
    Uic,
    AccountId,
  };
}
function reduce_trades(
  trades: b.s.transaction_t["Trades"],
  currency: currency_t,
) {
  const values = trades.reduce(
    (c, trade) => {
      let { Price, TradedQuantity, TradeExecutionTime } = trade;
      // Saxo is misreporting ZAR rounding
      if (currency !== "ZAR") Price = Math.round(Price * 100);
      c.price += Price;
      c.amount += TradedQuantity;
      c.time += util.time.ms(TradeExecutionTime);
      return c;
    },
    { price: 0, amount: 0, time: 0 },
  );
  let { price, amount, time } = values;
  const len = trades.length || 1;
  price = Math.round(price / len) / 100;
  time = Math.round(time / len);
  return { price, amount, time };
}

//private translate = (transactions: transactions_t["trades"]) => {
//  return Object.keys(transactions).reduce(
//    (c, uic) => {
//      const key = uic as unknown as number;
//      transactions[key]?.forEach((transaction) => {
//        const { ConversionRate: fx_buy, PositionId, Event } = transaction;
//        //if (Event !== "Buy") return;
//        if (!!c[PositionId])
//          throw Error(`Can only have one position per ID: ${key}`);
//        c[PositionId] = { fx_buy } as position_t;
//      });
//      return c;
//    },
//    {} as { [key: string]: position_t },
//  );
//};
//private to_uic = (transactions: b.s.transaction_t[]) => {
//  return transactions.reduce(
//    (c, transaction) => {
//      const { TransactionType, Instrument } = transaction;
//      const { Uic } = Instrument;
//
//      if (Uic === 0) {
//        c.fees.push(transaction);
//      } else if (
//        TransactionType === "CashAmount" ||
//        TransactionType === "CashTransfer"
//      ) {
//        c.money.push(transaction);
//      } else {
//        if (!c.trades[Uic]) c.trades[Uic] = [];
//        const {
//          ConversionRate,
//          Event,
//          OriginalTradeId,
//          PositionId,
//          RelatedTradeId,
//          RelatedPositionId,
//          TradeId,
//        } = transaction;
//        c.trades[Uic].push({
//          ConversionRate,
//          Event,
//          OriginalTradeId,
//          PositionId,
//          RelatedTradeId,
//          RelatedPositionId,
//          TradeId,
//        } as b.s.transaction_t);
//      }
//      return c;
//    },
//    {
//      fees: [],
//      money: [],
//      trades: {},
//    } as transactions_t,
//  );
//};
//private flatten_transfers = (trades: transactions_t["trades"]) => {
//  return Object.keys(trades).reduce(
//    (c, uic) => {
//      const key = uic as unknown as keyof typeof trades;
//      c[key] = flatten(trades[key]!, key);
//      return c;
//    },
//    {} as transactions_t["trades"],
//  );
//
//  function flatten(transactions: b.s.transaction_t[], key: number) {
//    return transactions.reduce((c, transaction) => {
//      transaction = structuredClone(transaction);
//      const { RelatedTradeId, Event, OriginalTradeId } = transaction;
//      if (Event !== "Buy") return c;
//      if (OriginalTradeId === 0) {
//        const related_trade = trades[key]!.find(
//          (t) =>
//            t.OriginalTradeId.toString() === RelatedTradeId &&
//            t.Event === Event,
//        );
//        transaction.PositionId =
//          related_trade?.PositionId || transaction.PositionId; //const { PositionId, ConversionRate } = transfer_details(
//        c.push(transaction);
//      }
//      return c;
//    }, [] as b.s.transaction_t[]);
//  }
//function transfer_details(key: number, transaction: b.s.transaction_t) {
//  const { Event, PositionId, ConversionRate, RelatedTradeId } = transaction;
//  const related_trade = trades[key]!.find(
//    (t) => t.TradeId === RelatedTradeId && t.Event === Event,
//  );
//  return {
//    PositionId: related_trade?.PositionId || PositionId,
//    ConversionRate: related_trade?.ConversionRate || ConversionRate,
//  };
//}
//function is_transfer(key: number, transaction: b.s.transaction_t) {
//  return trades[key]?.find(
//    (t) => transaction.OriginalTradeId.toString() === t.TradeId,
//  );
//}
