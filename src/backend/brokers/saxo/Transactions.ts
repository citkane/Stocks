import { Transactions as _Transactions } from "@backend/brokers/common";

const { client_key, start_date } = conf.saxo;
const { saxo: url } = util.url;

export class Transactions extends _Transactions {
  constructor() {
    super("saxo");
  }
  public update = (start_date = conf.saxo.start_date) =>
    this.transactions
      .fetch(start_date)
      .then((t) => logger.json("SAXO transactions raw", t))
      .then(this.transactions.categorise)
      .then(this.transactions.transform);

  private transactions = {
    fetch: async (
      date = start_date,
      skip = 0,
      transactions: b.s.transaction_t[] = [],
    ): Promise<b.s.transaction_t[]> => {
      const query = this.endpoints.transactions(skip, date);
      const _data = await this.saxo.fetch<b.s.transactions_t>(query);
      logger.json("SAXO transactions raw", _data);
      const data = [...transactions, ..._data.Data];
      const len = _data.Data.length;
      if (len === 0) return data;

      skip += len;
      return this.transactions.fetch(date, skip, data);
    },
    categorise: (transactions: b.s.transaction_t[]) => {
      let categorised = transactions.reduce((c, transaction) => {
        const { Event, Instrument } = transaction;
        const { Uic } = Instrument;

        if (!c[Uic]) c[Uic] = {} as categorised_t[number];
        if (!c[Uic][Event]) c[Uic][Event] = [];
        c[Uic][Event].push(transaction);

        return c;
      }, {} as categorised_t);
      return this.transactions.reduce.transfers(categorised);
    },
    format: (transaction: b.s.transaction_t): transctn_t => {
      let {
        Event,
        ConversionRate: fx_traded,
        PositionId: con_id,
        AccountId: a_id,
        TradeId: id,
        Bookings,
        BookedAmount,
        RelatedTradeId,
        Instrument,
        Trades,
        Date,
      } = transaction;
      let { Symbol, Uic, Currency: currency } = Instrument;

      const trade = this.transactions.reduce.trades(Trades);
      let kind = "" as transctn_t["kind"],
        price_traded = 0,
        amount = 0,
        date = 0;

      switch (Event) {
        case "Buy":
          kind = "buy";
          price_traded = trade.price;
          amount = trade.amount;
          date = trade.time;
          break;
        case "Final Maturity":
          kind = "sell";
          price_traded = trade.price;
          amount = trade.amount;
          date = trade.time;
          fx_traded = this.transactions.fx.final_maturity(transaction);
          id = `${RelatedTradeId}_close`;
          break;
        case "Sell":
          kind = "sell";
          price_traded = trade.price;
          amount = trade.amount;
          date = trade.time;
          break;
        case "Cash Dividend":
          const booking = Bookings.find((b) => b.AmountTypeId === "56")!;
          const { ConversionRate, BookingId } = booking;
          kind = "dividend";
          id = `d_${BookingId}`;
          con_id = BookingId;
          date = util.time.ms(Date);
          amount = 1;
          fx_traded = ConversionRate;
          price_traded = (BookedAmount * 100) / fx_traded / 100;
          break;
      }
      let positn = this.saxo.cache.position(Uic);
      if (!positn) {
        logger.warn("No position found for transaction", "saxo", Uic);
        let [ticker, exchange] = Symbol.split(":") as [string, string];
        exchange = exchange!.toUpperCase();
        exchange = this.saxo.exchgs.tv(exchange);
        if (exchange === "HKEX") ticker = util.string.unpad_hk_ticker(ticker);
        positn = {
          i_id: `${exchange}-${ticker}`,
        } as unknown as b.positn_t;
      }

      const { i_id } = positn;
      const broker = "saxo";
      const p_id: p_id_t = `${broker}_${Uic}`;
      return {
        id: id!,
        p_id,
        a_id,
        i_id,
        price_traded,
        amount,
        fx_traded,
        currency,
        date,
        //ticker,
        //exchange,
        kind,
        broker,
      };
    },
    transform: (transactions: categorised_t): transctn_t[] => {
      return this.transactions.reduce
        .transform(transactions)
        .map(this.transactions.format);
    },

    ids: {
      transfer: (buys?: b.s.transaction_t[]) => {
        if (!buys) return [] as b.s.transaction_t[];
        return buys.map((buy) => {
          if (buy.OriginalTradeId > 0) return buy;
          buy = structuredClone(buy);
          const ids = this.transactions.ids.parse(buy, buys);
          buy.PositionId = ids.PositionId;
          buy.AccountId = ids.AccountId;
          buy.TradeId = ids.TradeId;
          return buy;
        });
      },
      parse: (
        transaction: b.s.transaction_t,
        transactions: b.s.transaction_t[],
      ): {
        PositionId: string;
        AccountId: string;
        TradeId: string | undefined;
      } => {
        const { TradeId } = transaction;
        const transfer = transactions.find(
          (t) => TradeId === t.OriginalTradeId.toString(),
        );
        if (!!transfer)
          return this.transactions.ids.parse(transfer, transactions);

        const { PositionId, AccountId } = transaction;
        return { PositionId, AccountId, TradeId };
      },
    },
    fx: {
      /**
       * Retrieve the fx rate for final maturity transaction from booking
       * @param transaction
       * @returns fx rate
       */
      final_maturity: (transaction: b.s.transaction_t) => {
        const fx_rounding = 1000000;
        const { Bookings } = transaction;
        let fx_rate = Bookings.reduce((c, booking) => {
          c += booking.ConversionRate * fx_rounding;
          return c;
        }, 0);
        fx_rate = Math.round(fx_rate / Bookings.length) / fx_rounding;
        return fx_rate;
      },
    },
    reduce: {
      transfers: (transactions: categorised_t) => {
        const uics = Object.keys(transactions) as unknown as number[];
        return uics.reduce((c, Uic) => {
          const _transactions = transactions[Uic]!;
          let { Buy, Sell } = _transactions;
          Buy = Buy
            ? this.transactions.ids
                .transfer(Buy)
                .filter((b) => b.OriginalTradeId === 0)
            : [];
          Sell = Sell ? Sell.filter((s) => s.OriginalTradeId === 0) : [];

          c[Uic] = { ..._transactions, ...{ Buy, Sell } };
          return c;
        }, {} as categorised_t);
      },
      trades: (trades: b.s.transaction_t["Trades"]) => {
        const values = trades.reduce(
          (c, trade) => {
            let { Price, TradedQuantity, TradeExecutionTime } = trade;
            Price = Math.round(Price * 100);
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
      },
      transform: (transactions: categorised_t) => {
        const uics = Object.keys(transactions) as unknown as number[];
        return uics.reduce((c, Uic) => {
          const {
            Buy,
            Sell,
            "Final Maturity": final_maturity,
            "Cash Dividend": dividends,
          } = transactions[Uic]!;

          return [
            ...c,
            ...(Buy || []),
            ...(Sell || []),
            ...(final_maturity || []),
            ...(dividends || []),
          ];
        }, [] as b.s.transaction_t[]);
      },
    },
  };

  private endpoints = {
    transactions: (skip: number, start_date: string) => {
      const transaction_types = "All";

      const params = [
        `FromDate=${start_date}`,
        `ToDate=${util.time.epoch.to_iso_date()}`,
        `TransactionType=${transaction_types}`,
        `ClientKey=${client_key}`,
        `$skip=${skip}`,
      ].join("&");
      return `${url.history}/transactions?${params}`;
    },
  };
}

type events_t = b.s.transaction_t["Event"];
type categorised_t = {
  [key: number]: { [key in events_t]: b.s.transaction_t[] };
};
