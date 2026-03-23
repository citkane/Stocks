import { Global } from "@backend/Global";
import { Position } from "./Positions";

type count_t = { [key: string]: number };

/**
 * Fetches transactions for the given conid from the IBKR API
 **/
class Transaction extends Global {
  constructor(private conid: number) {
    super();
  }

  public update_transactions = async () => {
    delete this._sells;
    delete this._transfers;
    delete this._id_counts;
    this.transactions = await this.ibkr.cache.get_transactions(this.conid);
    return this.fetch_transactions().then(
      (transactions) =>
        (this.transactions = [...this.transactions, ...transactions]),
    );
  };

  protected get sells() {
    return (
      this._sells ||
      (this._sells = this.transactions.filter((t) => t.type === "Sell"))
    );
  }
  protected get transfers() {
    return (
      this._transfers ||
      (this._transfers = this.transactions.filter((t) => t.type === "Transfer"))
    );
  }
  protected transactions: ibkr_t.transaction_t[] = [];

  private async fetch_transactions() {
    const accounts = await this.ibkr.cache.account_ids;
    const { url, params } = this.endpoints.post.transactions(
      accounts,
      this.conid,
      this.base_currency,
      this.last_transaction_days_ago,
    );
    return this.ibkr
      .fetch<ibkr_t.transactions_t>(url, params)
      .then((transactions) => transactions.transactions)
      .then(this.id.dedupe)
      .then(this.id.add);
  }

  private endpoints = {
    post: {
      transactions: (
        acctIds: string[],
        con_id: number,
        currency: currency_t,
        days: number,
      ) => {
        return {
          url: `${this.api_url}/pa/transactions`,
          params: {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ acctIds, conids: [con_id], currency, days }),
          },
        };
      },
    },
  };
  private get last_transaction_days_ago() {
    const last_transaction = this.transactions[this.transactions.length - 1];
    const date = !!last_transaction
      ? last_transaction.date
      : conf.ibkr.start_date;
    return util.time.aging_days(date);
  }
  private get api_url() {
    return util.url.ibkr.api;
  }

  /**
   * IBKR API transaction returns are not uniquely ID'd.
   * IBKR transaction dates are not timestamped, thus the max granulaity is 1 day.
   * We need to extrapolate a UID for each transaction and ensure that updates
   * do not create duplicates.
   */
  private id = {
    dedupe: (transactions: ibkr_t.transaction_t[]) => {
      if (!this.transactions.length) return transactions;
      const last_day = this.transactions[this.transactions.length - 1]?.date!;
      const last_committed = this.transactions.filter(
        (t) => t.date === last_day,
      );
      const new_batch = transactions.reduce(
        (c, transaction) => {
          transaction.date === last_day
            ? c.same_day.push(transaction)
            : c.later.push(transaction);
          return c;
        },
        {
          same_day: [] as ibkr_t.transaction_t[],
          later: [] as ibkr_t.transaction_t[],
        },
      );
      const i = last_committed.length - 1;
      const len = new_batch.same_day.length - 1;
      new_batch.same_day = new_batch.same_day.slice(i, len);
      return [...new_batch.same_day, ...new_batch.later];
    },
    /**
     * Mutate the given IBKR transaction objects to include an unique ID
     * @param transactions
     * @returns Mutated transactions
     */
    add: (transactions: ibkr_t.transaction_t[]) => {
      return transactions.map((transaction) => this.id._add(transaction));
    },

    _add: (transaction: ibkr_t.transaction_t) => {
      (transaction as any).id = this.id.make(transaction);
      return transaction;
    },
    /**
     * Create a unique ID for the given transaction
     * @param transaction
     * @param count
     * @returns
     */
    make: (transaction: ibkr_t.transaction_t) => {
      const { conid, rawDate, acctid, type, amt } = transaction;
      let id = `${conid}_${acctid}_${rawDate}_${type}_${amt}`;
      id = `${id}_${this.id.increment(id)}`;
      return id;
    },
    increment: (id: string) => {
      if (!this.id_counts[id]) return (this.id_counts[id] = 0);
      return this.id_counts[id]++;
    },
  };

  private get id_counts() {
    return this._id_counts
      ? this._id_counts
      : (this._id_counts = this.transactions.reduce((c, transaction) => {
          let id = (transaction as ibkr_t.transaction_t & { id: string }).id;
          const id_array = id.split("_");
          const count = Number(id_array.pop()!);
          id = id_array.join("_");
          c[id] = count;
          return c;
        }, {} as count_t));
  }
  private _id_counts?: count_t;
  private _sells?: ibkr_t.transaction_t[];
  private _transfers?: ibkr_t.transaction_t[];
}

/**
 * Extrapolates IBKR transactions for the given conid into frontend positions.
 *
 * The IBKR API only returns aggragate positions, thus necessitating extrapolating individual
 * position lots from transactions.
 */
export class Transactions extends Transaction {
  constructor(private position: ibkr_t.position_t) {
    super(position.conid);
  }
  public get positions() {
    return this.buys.map((buy, i) =>
      new Position(
        this.position,
        i,
        buy.fxRate,
        util.time.ms(buy.date),
        buy.pr!,
      ).translate(),
    );
  }

  /**
   * Calculate and ID the buy transactions relevant to position lots.
   */
  private process_buys = {
    /**
     * Some position lots may be a result of external transfers, thus have no explicit buys.
     * Some buy transactions may be sold, thus are closed and filtered out
     */
    calc: () => {
      let _buys = this.transactions.filter((t) => t.type === "Buy");
      const { sells } = this;
      if (!sells.length)
        return (this._buys = [..._buys, ...this.process_buys.find_transfers()]);

      _buys = structuredClone(_buys);

      return (this._buys = [
        ...sells
          .sort((a, b) => b.qty! - a.qty!)
          .reduce((a, sell) => {
            const sell_buys = this.process_buys.narrow_for_sell(sell, _buys);
            return [...a, ...this.process_buys.subtract_sell(sell, sell_buys)];
          }, [] as ibkr_t.transaction_t[]),
        ...this.process_buys.find_transfers(),
      ]);
    },
    /**
     * Find external transfers that qualify as a buy transaction
     */
    find_transfers: () => {
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
            const found =
              t_o.date === t_i.date && Math.abs(t_o.qty!) === t_i.qty;
            if (found) transfer_out.splice(i, 1);
            return found;
          });
        });
      return transfer_in;
    },

    /**
     * Best effort to associate sells with buys and tally the position amount
     * to filter out colsed position lots.
     * @param sell
     * @param mutable_buys
     * @returns Transactions that qualify as open buy lots
     */
    subtract_sell: (
      sell: ibkr_t.transaction_t,
      mutable_buys: ibkr_t.transaction_t[],
    ) => {
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
    },
    /**
     * Narrow the potential buy transactions for the given sell transaction
     * @param sell
     * @param buys
     * @returns Buy transactions that pre-date the sell and have position amounts remaining
     */
    narrow_for_sell: (
      sell: ibkr_t.transaction_t,
      buys: ibkr_t.transaction_t[],
    ) => {
      const sell_date = util.time.ms(sell.date);
      return (
        buys?.filter((buy) => {
          const buy_date = util.time.ms(buy.date);
          const is_later = sell_date >= buy_date;
          const is_affordable = Math.abs(sell.qty!) <= buy.qty!;
          return is_later && is_affordable;
        }) || []
      );
    },
  };

  /**
   * Qualified open buys for the conid
   */
  private get buys() {
    return this._buys ? this._buys : this.process_buys.calc();
  }
  private _buys?: ibkr_t.transaction_t[];
}
