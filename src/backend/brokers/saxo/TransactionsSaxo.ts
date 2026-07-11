import { Global } from "@backend/Global";

export class TransactionsSaxo extends Global {
  public update = (start_date = conf.saxo.start_date) => {
    const { fetch, categorise, transform } = this.transactions;
    return fetch(start_date as g.iso_date)
      .then(categorise)
      .then(transform);
  };

  public last_update_date = async () => {
    const [date] = await this.db.select.transctns(
      ["broker", "saxo"],
      ["date"],
      ["date", "DESC"],
    );

    let last_date = date?.date;
    last_date = last_date ? last_date : util.time.ms(conf.saxo.start_date);
    last_date = last_date - util.time.period.to_ms([1, "d"]);
    return util.time.epoch.to_iso_date(last_date);
  };
  private transactions = {
    fetch: async (
      date: g.iso_date,
      skip = 0,
      transactions: b.s.transaction_t[] = [],
    ): Promise<b.s.transaction_t[]> => {
      const { get, fetch } = this.saxo.api;
      const req = get.transactions(skip, date);
      const _data = await fetch<b.s.transactions_t>(req);
      logger.json("SAXO transactions raw", _data);
      const data = [...transactions, ..._data.Data];
      const len = _data.Data.length;
      if (len === 0) return data;

      skip += len;
      return this.transactions.fetch(date, skip, data);
    },
    categorise: (transactions: b.s.transaction_t[]) => {
      let categorised = transactions.reduce((c, transaction) => {
        const { Event, Instrument, IsIntradayData } = transaction;
        const { Uic } = Instrument;

        if (!c[Uic]) c[Uic] = {} as p.categorised[number];
        if (!c[Uic][Event]) c[Uic][Event] = [];
        if (!IsIntradayData) c[Uic][Event].push(transaction);

        return c;
      }, {} as p.categorised);
      return this.transactions.reduce.transfers(categorised);
    },
    format: async (transaction: b.s.transaction_t): Promise<g.transctn> => {
      let {
        Event,
        ConversionRate: traded_fx,
        AccountId: a_id,
        TradeId: id,
        Bookings,
        BookedAmount,
        RelatedTradeId,
        Instrument,
        Trades,
        Date,
      } = transaction;
      let { Uic, Currency: currency, Symbol } = Instrument;
      currency = currency === "ZAR" ? "ZAC" : currency;

      const trade = this.transactions.reduce.trades(Trades);
      let kind = "" as g.transctn["kind"],
        traded_price = 0,
        amount = 0,
        date = 0;

      switch (Event) {
        case "Buy":
          kind = "buy";
          traded_price = trade.price;
          amount = trade.amount;
          date = trade.time;
          break;
        case "Final Maturity":
          kind = "sell";
          traded_price = trade.price;
          amount = trade.amount;
          date = trade.time;
          traded_fx = this.transactions.fx.final_maturity(transaction);
          id = `${RelatedTradeId}_close`;
          break;
        case "Sell":
          kind = "sell";
          traded_price = trade.price;
          amount = trade.amount;
          date = trade.time;
          break;
        case "Cash Dividend":
          const booking = Bookings.find((b) => b.AmountTypeId === "56")!;
          const { ConversionRate, BookingId } = booking;
          kind = "dividend";
          id = `d_${BookingId}`;
          date = util.time.ms(Date);
          amount = 1;
          traded_fx = ConversionRate;
          traded_price = BookedAmount; //(BookedAmount * 100) / traded_fx / 100;
          break;
      }
      let instrmnt = (await this.db.select.instrmnts(["saxo_id", Uic]))[0];
      if (!instrmnt) {
        logger.warn("No instrument found for transaction", "saxo", Uic);

        let [ticker, exchange] = Symbol.split(":") as [string, string];
        exchange = exchange!.toUpperCase();
        if (exchange === "HKEX") ticker = util.string.unpad_hk_ticker(ticker);
        instrmnt = {
          i_id: `${exchange}-${ticker}`,
        } as g.instrmnt;
      }

      const { i_id } = instrmnt;
      const broker = "saxo";
      return {
        id: id!,
        a_id,
        i_id,
        traded_price,
        amount,
        traded_fx,
        currency,
        date,
        kind,
        broker,
      };
    },
    transform: (transactions: p.categorised): Promise<g.transctn[]> => {
      const { reduce, format } = this.transactions;
      return Promise.all(reduce.transform(transactions).map(format));
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
      transfers: (transactions: p.categorised) => {
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
        }, {} as p.categorised);
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
      transform: (transactions: p.categorised) => {
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
}

namespace p {
  type events = b.s.transaction_t["Event"];
  export type categorised = {
    [key: number]: { [key in events]: b.s.transaction_t[] };
  };
}
