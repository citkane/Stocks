import { Global } from "backend";
import { Transactions } from "./Transactions";

type positions_t = ibkr_t.position_t[];

const page_limit = 100;

export class Positions extends Global {
  public select_positions = () => this.db.select.positions("ibkr");
  public update = () =>
    Promise.all(this.ibkr.cache.accounts.map((a) => this.get_positions(a)))
      .then((ps) => ps.flat())
      .then(this.audit_positions)
      .then(this.map_transactions_to_positions);

  private map_transactions_to_positions = (pos: ibkr_t.position_t[]) =>
    Promise.all(
      pos.map((p) =>
        new Transactions(p)
          .update_transactions()
          .then((transaction) => transaction.positions),
      ),
    ).then((pos) => pos.flat());

  private get_positions = (a: account_t, p = 0, _pos: positions_t = []) =>
    this.ibkr
      .fetch<positions_t>(this.endpoints.get.positions(a.a_id, p))
      .then((pos) => this.page(a, p, [..._pos, ...pos], pos.length));

  private page = (
    a: account_t,
    p = 0,
    pos: positions_t,
    len: number,
  ): Promise<positions_t> =>
    len >= page_limit
      ? this.get_positions(a, p++, pos)
      : this.audit_positions(pos);

  private audit_positions = (pos: positions_t) =>
    Promise.all(
      pos.map((p) => (!!p.name ? p : this.get_position(p.acctId!, p.conid))),
    ).then((p) => p.flat());

  private get_position = (account_id: string, conid: number) =>
    this.ibkr.fetch<ibkr_t.position_t>(
      this.endpoints.get.position(account_id, conid),
    );

  private endpoints = {
    get: {
      positions: (account_id: string, page: number) =>
        `portfolio/${account_id}/positions/${page}`,
      position: (account_id: string, con_id: number) =>
        `portfolio/${account_id}/position/${con_id}`,
    },
    post: {
      positions_invalidate_cache: (account_id: string) =>
        `portfolio/${account_id}/positions/invalidate`,
    },
  };
}

export class Position extends Global {
  constructor(
    private position: ibkr_t.position_t,
    private index: number,
    private fx_buy: number,
    private date: number,
    private price_buy: number,
  ) {
    super();
  }
  translate(): position_t {
    const p = this.position;
    const { exchange, ticker, description } = util.string.format_ticker(
      p.listingExchange,
      p.ticker,
      p.name,
    );

    const {
      conid,
      currency,
      acctId: a_id,
      position,
      mktPrice: price_market,
    } = p;

    const { index, fx_buy, date, price_buy } = this;

    return {
      p_id: `ibkr_${conid}_${index}`,
      con_id: conid.toString(),
      broker: "ibkr",
      a_id,
      description,
      ticker,
      currency,
      exchange,
      position,
      fx_market: this.brokers.fx_rate(currency),
      fx_buy,
      date,
      price_market,
      price_buy,
    };
  }
}

//public merge_position_transactions = (positions: ibkr_t.position_t[]) =>
//  Promise.all(
//    positions.map((p) =>
//      this.transactions_history(
//        this.cache.ibkr_account_ids,
//        p.conid!,
//        this.brokers.base_currency,
//      ).then((t) => {
//        p.transactions = t;
//        return p;
//      }),
//    ),
//  ).then((p) => p.flat());
//private transactions_history = (
//  account_ids: string[],
//  con_id: number,
//  currency: currency_t,
//) => {
//  return Promise.resolve(this.db.select.ibkr_transactions(con_id));
//  //const { endpoint, params } = this.endpoints.post.transactions_history(
//  //  account_ids,
//  //  con_id,
//  //  currency,
//  //  util.time.aging_days(conf.start_date),
//  //);
//  //return this.ibkr
//  //  .fetch<ibkr_t.transactions_t>(endpoint, params)
//  //  .then((transactions) => transactions.transactions);
//};

//export class IbkrPositions {
//  constructor(
//    //private transactions: ibkr_t.transaction_t[],
//    private p: ibkr_t.position_t,
//  ) {
//    this.positions = this.buys.map(
//      (buy, i) =>
//        new IbkrPosition(
//          this.p,
//          i,
//          buy.fxRate,
//          util.time.ms(buy.date),
//          buy.pr!,
//        ),
//    );
//  }
//  public positions: IbkrPosition[];
//
//  private get transfers() {
//    return this.p.transactions.filter(
//      (t) => t.type === "Transfer", //&& t.acctid === this.account_id,
//    );
//  }
//  private get buys() {
//    return this._buys ? this._buys : this.calculate_buys();
//  }
//  private get sells() {
//    return this.p.transactions.filter((t) => t.type === "Sell");
//  }
//
//  private calculate_buys() {
//    let _buys = this.p.transactions.filter((t) => t.type === "Buy");
//    const { sells } = this;
//    if (!sells.length)
//      return (this._buys = [..._buys, ...this.find_transfer_buys()]);
//
//    _buys = structuredClone(_buys);
//
//    return (this._buys = [
//      ...sells
//        .sort((a, b) => b.qty! - a.qty!)
//        .reduce((a, sell) => {
//          const sell_buys = this.narrow_buys_for_sell(sell, _buys);
//          return [...a, ...this.subtract_sell_from_buys(sell, sell_buys)];
//        }, [] as ibkr_t.transaction_t[]),
//      ...this.find_transfer_buys(),
//    ]);
//  }
//  private find_transfer_buys() {
//    const transfers = structuredClone(this.transfers).map((t) => {
//      const qty_str = t.desc.split(":").pop()!.replaceAll(",", "");
//      t.qty = Number(qty_str);
//      t.pr = Math.floor(t.amt * 100) / t.qty / 100;
//      return t;
//    });
//    const transfer_out = transfers.filter((t) => t.qty! < 0);
//    const transfer_in = transfers
//      .filter((t) => t.qty! > 0)
//      .filter((t_i) => {
//        return !transfer_out.find((t_o, i) => {
//          const found = t_o.date === t_i.date && Math.abs(t_o.qty!) === t_i.qty;
//          if (found) transfer_out.splice(i, 1);
//          return found;
//        });
//      });
//    return transfer_in;
//  }
//  private subtract_sell_from_buys(
//    sell: ibkr_t.transaction_t,
//    mutable_buys: ibkr_t.transaction_t[],
//  ) {
//    let sold = Math.abs(sell.qty!);
//    return mutable_buys
//      .map((bought) => {
//        if (bought.qty! >= sold) {
//          bought.qty = bought.qty! - sold;
//        } else {
//          sold = sold - bought.qty!;
//          bought.qty = 0;
//        }
//        return bought;
//      })
//      .filter((b) => b.qty! > 0);
//  }
//
//  private narrow_buys_for_sell(
//    sell: ibkr_t.transaction_t,
//    buys: ibkr_t.transaction_t[],
//  ) {
//    const sell_date = util.time.ms(sell.date);
//    return (
//      buys?.filter((buy) => {
//        const buy_date = util.time.ms(buy.date);
//        const is_later = sell_date >= buy_date;
//        const is_affordable = Math.abs(sell.qty!) <= buy.qty!;
//        return is_later && is_affordable;
//      }) || []
//    );
//  }
//  private _buys?: ibkr_t.transaction_t[];
//}
//
