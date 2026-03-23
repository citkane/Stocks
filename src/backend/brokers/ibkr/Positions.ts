import { Global } from "backend";
import { Transactions } from "./Transactions";

const page_limit = 100;
type transactions_data_t = {
  trans_instance: Transactions;
  transactions: ibkr_t.transaction_t[];
};
type positions_data_t = {
  transactions: ibkr_t.transaction_t[];
  positions: position_t[];
};

/**
 * Fetches and extrapolates positions from the IBKR API
 */
export class Positions extends Global {
  public update = () =>
    this.ibkr.cache.accounts
      .then(this.position.accounts)
      .then(this.position.audit)
      .then(this.transaction.update)
      .then(this.transaction.position_data)
      .then((data) => {
        const { transactions, positions } = data;
        this.ibkr.cache.transactions = Promise.resolve(transactions);
        return positions;
      });

  private transaction = {
    update: (pos: ibkr_t.position_t[]) =>
      Promise.all(pos.map(this.transaction._update)),
    _update: (position: ibkr_t.position_t) => {
      const trans_instance = new Transactions(position);
      return trans_instance
        .update_transactions()
        .then(
          (transactions) =>
            ({ trans_instance, transactions }) as transactions_data_t,
        );
    },
    position_data: (data: transactions_data_t[]) => {
      return data.reduce(
        (c, data) => {
          c.transactions = [...c.transactions, ...data.transactions];
          c.positions = [...c.positions, ...data.trans_instance.positions];
          return c;
        },
        { transactions: [], positions: [] } as positions_data_t,
      );
    },
  };
  private position = {
    accounts: (accounts: account_t[]) =>
      Promise.all(accounts.map(this.position._accounts)).then((positions) =>
        positions.flat(),
      ),
    _accounts: (account: account_t) => this.position.get(account),
    get: (a: account_t, p = 0, pos: ibkr_t.position_t[] = []) =>
      this.ibkr
        .fetch<
          ibkr_t.position_t[]
        >(this.endpoints.get.positions(a.a_id_original, p))
        .then((_pos) =>
          this.position.page(a, p, [...pos, ..._pos], _pos.length),
        ),
    _get: (account_id: string, conid: number) =>
      this.ibkr.fetch<ibkr_t.position_t>(
        this.endpoints.get.position(account_id, conid),
      ),
    page: (
      a: account_t,
      p = 0,
      pos: ibkr_t.position_t[],
      len: number,
    ): Promise<ibkr_t.position_t[]> =>
      len >= page_limit
        ? this.position.get(a, p++, pos)
        : this.position.audit(pos),
    audit: (pos: ibkr_t.position_t[]) =>
      Promise.all(
        pos.map((p) => (!!p.name ? p : this.position._get(p.acctId!, p.conid))),
      ).then((p) => p.flat()),
  };

  private endpoints = {
    get: {
      positions: (account_id: string, page: number) =>
        `${this.api_url}/portfolio/${account_id}/positions/${page}`,
      position: (account_id: string, con_id: number) =>
        `${this.api_url}/portfolio/${account_id}/position/${con_id}`,
    },
    post: {
      positions_invalidate_cache: (account_id: string) =>
        `${this.api_url}/portfolio/${account_id}/positions/invalidate`,
    },
  };
  private get api_url() {
    return util.url.ibkr.api;
  }
}

/**
 * Normalises a IBKR position into a frontend position
 */
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
      fx_market: this.fx_rate(currency),
      fx_buy,
      date,
      price_market,
      price_buy,
    };
  }
}
