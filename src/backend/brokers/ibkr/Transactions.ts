import { Global } from "@backend/Global";
import { Position } from "./Positions";

type count_t = { [key: string]: number };

class Transaction extends Global {
  constructor(private con_id: number) {
    super();
  }

  public update_transactions() {
    return this.fetch().then((ts) => {
      this.transactions = ts;
      delete this._position;
      delete this._sells;
      delete this._transfers;
      return this;
    }); //this.db.select.ibkr_transactions(this.con_id);
  }

  private fetch() {
    const { endpoint, params } = this.endpoint(
      this.ibkr.cache.account_ids,
      this.con_id,
      this.brokers.base_currency,
      this.last_transaction_days_ago,
    );
    return this.ibkr
      .fetch<ibkr_t.transactions_t>(endpoint, params)
      .then((transactions) => transactions.transactions)
      .then(this.add_transactions_ids)
      .then((trans) => (this.ibkr.cache.transactions = trans))
      .then(() => this.ibkr.cache.transactions_for_con(this.con_id));
    //.then(this.update_transactions);
  }

  private add_transactions_ids = (transactions: ibkr_t.transaction_t[]) =>
    transactions.map((t, i) => map_transaction_id(t, i));

  private get last_transaction_days_ago() {
    if (!this.transactions.length)
      return util.time.aging_days(conf.ibkr.start_date);
    const date = this.transactions[this.transactions.length - 1]?.date!;
    return util.time.aging_days(date);
  }
  private endpoint(
    acctIds: string[],
    con_id: number,
    currency: currency_t,
    days: number,
  ) {
    return {
      endpoint: `pa/transactions`,
      params: {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acctIds, conids: [con_id], currency, days }),
      },
    };
  }

  protected get sells() {
    return (
      this._sells ||
      (this._sells = this.transactions.filter((t) => t.type === "Sell"))
    );
  }
  //private get buys() {
  //  return (
  //    this._buys ||
  //    (this._buys = this.transactions.filter((t) => t.type === "Buy"))
  //  );
  //}
  protected get transfers() {
    return (
      this._transfers ||
      (this._transfers = this.transactions.filter((t) => t.type === "Transfer"))
    );
  }
  //private get buy() {
  //  return (this.buys[0] || this.transfers[0])!;
  //}
  //private get description() {
  //  return util.string.title_case(this.buy.desc!);
  //}
  //private get account_id() {
  //  return (
  //    this.transfers[this.transfers.length - 1]?.acctid || this.buy.acctid!
  //  );
  //}
  //private get is_open() {
  //  return this.is_external_transfer || this.position > 0;
  //}
  //private get position() {
  //  return (
  //    this._position ||
  //    (this._position = this.transactions.reduce(
  //      (accum, t) => (accum += t.qty || 0),
  //      0,
  //    ))
  //  );
  //}
  //
  //private get is_external_transfer() {
  //  return !this.buys.length && !this.sells.length;
  //}

  protected transactions: ibkr_t.transaction_t[] = [];
  private _position?: number;
  //private _buys?: ibkr_t.transaction_t[];
  private _sells?: ibkr_t.transaction_t[];
  private _transfers?: ibkr_t.transaction_t[];
}

export class Transactions extends Transaction {
  constructor(private ibkr_position: ibkr_t.position_t) {
    super(ibkr_position.conid);
  }
  public get positions() {
    return this.buys.map((buy, i) =>
      new Position(
        this.ibkr_position,
        i,
        buy.fxRate,
        util.time.ms(buy.date),
        buy.pr!,
      ).translate(),
    );
  }

  private get buys() {
    return this._buys ? this._buys : this.calculate_buys();
  }

  private calculate_buys() {
    let _buys = this.transactions.filter((t) => t.type === "Buy");
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

let count: count_t;
function map_transaction_id(t: ibkr_t.transaction_t, i: number) {
  if (i === 0) count = {};
  (t as any).id = transaction_id(t, count);
  return t;
}
function transaction_id(transaction: ibkr_t.transaction_t, count: count_t) {
  const { conid, rawDate, acctid, type, amt } = transaction;
  let id = `${conid}_${acctid}_${rawDate}_${type}_${amt}`;
  if (!count[id]) count[id] = 0;
  id = `${id}_${count[id]}`;
  count[id]!++;
  return id;
}
