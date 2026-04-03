import { Transactions as _Transactions } from "@backend/brokers/common";

const start_days = util.time.aging_days(conf.ibkr.start_date);
const { ibkr: url } = util.url;

export class Transactions extends _Transactions {
  constructor() {
    super("ibkr");
  }
  public async update(acc_ids: string[], con_ids: number[], days = start_days) {
    const curr = this.base_currency;
    const p = { acc_ids, con_ids, curr, days };

    return (
      this.transactions
        .fetch(p)
        //.then((t) => logger.json("IBKR transactions raw", t))
        .then(this.transactions.categorise)
        //.then((t) => logger.json("IBKR transactions categorised", t))
        .then(this.transactions.transform)
    );
    //.then((t) => logger.json("IBKR transactions transformed", t));
  }

  private transactions = {
    fetch: (p: transactions_p) => {
      return Promise.all(
        p.con_ids.reduce(
          (c, conid) => {
            const _p = { ...p, ...{ con_ids: [conid] } };
            const { url, params } = this.endpoints.post.transactions(_p);
            const fn = () => this.ibkr.fetch<b.i.transactions_t>(url, params);

            const transactions = this.fetcher<b.i.transactions_t>(fn).then(
              (data) => (data.transactions ? data.transactions : []),
            );
            c.push(transactions);
            return c;
          },
          [] as Promise<b.i.transaction_t[]>[],
        ),
      ).then((transactions) => transactions.flat());
    },
    /**
     * Reduce an array of transactions into categorised arrays,
     * keyed by conid and then by Buy / Sell / Transfer
     */
    categorise: (transactions: b.i.transaction_t[]) => {
      return transactions.reduce((c, transaction) => {
        const { type, conid } = transaction;

        if (!c[conid]) c[conid] = {} as categorise_t[typeof conid];
        if (!c[conid][type]) c[conid][type] = [];
        c[conid][type].push(transaction);

        return c;
      }, {} as categorise_t);
    },
    /** Transforms IBKR transactions to the normalised transaction type.*/
    transform: async (transactions: categorise_t) => {
      const market_view = await this.ibkr.cache.market_view;

      return Object.keys(transactions).reduce((c, conid) => {
        const categorised = transactions[conid as any]!;
        const { Buy, Sell } = this.transactions.transfer(categorised);

        [...(Buy || []), ...(Sell || [])].forEach((transaction) => {
          const {
            conid,
            acctid: a_id,
            cur: currency,
            qty: amount,
            pr: price_traded,
            fxRate: fx_traded,
            date: date_string,
            type,
          } = transaction;

          const view = market_view.get(`ibkr_${conid}`);
          const id = this.transactions.uid(transaction);
          const date = util.time.ms(date_string);
          const kind = type === "Buy" ? "buy" : "sell";

          if (!view) {
            console.error("No market view found for transaction", transaction);
            return;
          }

          const { ticker: ti, exchange: ex, description: desc } = view;
          const params = [ex!, ti!, desc!] as const;
          const { format_ticker } = util.string;
          const { exchange, ticker, description } = format_ticker(...params);

          const _transaction = {
            id,
            con_id: String(conid),
            p_id: `ibkr_${conid}`,
            a_id,
            broker: "ibkr",
            description,
            ticker,
            currency,
            exchange,
            amount,
            fx_traded,
            price_traded,
            date,
            kind,
          } as transaction_t;

          c.push(_transaction);
        });
        return c;
      }, [] as transaction_t[]);
    },
    /** Create a unque id for the given transactions */
    uid: (transaction: b.i.transaction_t) => {
      const string = Object.keys(transaction)
        .map((key) => transaction[key as keyof typeof transaction])
        .join("");
      const hasher = new Bun.CryptoHasher("md5");
      hasher.update(string);
      return hasher.digest("hex");
    },
    /** Identifies external transfers in and coverts them to buy.
     *  Maps transfer account ids to buys.*/
    transfer: (view: view_t) => {
      let { Transfer, Buy } = view;
      if (!Transfer) return view;
      if (!Buy) Buy = [];
      const transfers = Transfer.sort((a, b) =>
        b.rawDate.localeCompare(a.rawDate),
      )
        .map((transfer) => {
          let { desc, amt, rawDate, fxRate } = transfer;

          const kind = amt! > 0 ? "in" : "out";
          const qty = Number(desc.split("Quantity: ")[1]!.replaceAll(",", ""));
          let pr = Math.round(util.money.whole_money(amt / fxRate) / qty);
          pr = pr / 100;

          const match = desc.match(/\(([^)]+)\)/);
          let id = match ? match[0] : "";
          id = `${id}_${rawDate}_${Math.abs(qty)}`;

          return { ...transfer, ...{ id, kind, pr, qty } };
        })
        .map((transfer, _i, original) => {
          const is_external =
            original.filter((t) => transfer.id === t.id).length === 1;
          return is_external
            ? { ...transfer, ...{ kind: "external" } }
            : transfer;
        })
        .reduce(
          (c, transfer) => {
            const { kind } = transfer;
            c[kind as keyof typeof c].push(transfer);
            return c;
          },
          { in: [], out: [], external: [] } as {
            in: b.i.transaction_t[];
            out: b.i.transaction_t[];
            external: b.i.transaction_t[];
          },
        );
      Buy = Buy.map((buy) => {
        const { acctid } = transfers.in[0]!;
        return { ...buy, ...{ acctid } };
      });
      view.Buy = [...Buy, ...transfers.external];

      return view;
    },
  };
  /**
   * Fetch with error retry iterator
   * @param fetcher callback fetch function
   */
  private fetcher = <T>(fetcher: () => Promise<T>, retry = 0) => {
    return fetcher().catch((err) => {
      if (retry > 3) {
        throw err;
      }
      console.warn(`Failed to fetch IBKR transactions, retry: ${retry}`);
      return new Promise<T>((res, rej) =>
        setTimeout(() => {
          retry++;
          this.fetcher(fetcher, retry).then(res).catch(rej);
        }, 1000),
      );
    });
  };
  private endpoints = {
    post: {
      transactions: (p: transactions_p) => {
        const body = JSON.stringify({
          acctIds: p.acc_ids,
          conids: p.con_ids,
          currency: p.curr,
          days: p.days,
        });
        return {
          url: `${url.api}/pa/transactions`,
          params: {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
          },
        };
      },
    },
  };
}

type view_t = { [key in b.i.transaction_t["type"]]: b.i.transaction_t[] };
type categorise_t = {
  [key: number]: view_t;
};
type transactions_p = {
  acc_ids: string[];
  con_ids: number[];
  curr: currency_t;
  days: number;
};
