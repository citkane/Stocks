import { Global } from "backend";

type post_t = { endpoint: string; params: RequestInit };
type position_partial_t = Partial<ibkr_t.position_t> | ibkr_t.position_t;

const page_limit = 100;

export default class Positions extends Global {
  public get_positions = (
    account_id: string,
    page = 0,
    positions: position_partial_t[] = [],
  ): Promise<position_partial_t[]> =>
    this.ibkr
      .fetch<
        position_partial_t[]
      >(this.endpoints.get.positions(account_id, page))
      .then((_positions) =>
        this.page_positions(
          account_id,
          page,
          [...positions, ..._positions],
          _positions.length,
        ),
      );
  public audit_positions = (positions: ibkr_t.position_t[]) =>
    Promise.all(
      positions.map((p) =>
        !!p.name ? p : this.get_position(p.acctId!, p.conid),
      ),
    ).then((p) => p.flat());

  public merge_position_transactions = (positions: ibkr_t.position_t[]) =>
    Promise.all(
      positions.map((p) =>
        this.transactions_history(
          this.cache.ibkr_account_ids,
          p.conid!,
          this.brokers.base_currency,
        ).then((t) => {
          p.transactions = t;
          return p;
        }),
      ),
    ).then((p) => p.flat());

  private get_position = (account_id: string, conid: number) =>
    this.ibkr.fetch<ibkr_t.position_t>(
      this.endpoints.get.position(account_id, conid),
    );

  private transactions_history = (
    account_ids: string[],
    con_id: number,
    currency: currency_t,
  ) => {
    return Promise.resolve(this.db.select.ibkr_transactions(con_id));
    //const { endpoint, params } = this.endpoints.post.transactions_history(
    //  account_ids,
    //  con_id,
    //  currency,
    //  util.time.aging_days(conf.start_date),
    //);
    //return this.ibkr
    //  .fetch<ibkr_t.transactions_t>(endpoint, params)
    //  .then((transactions) => transactions.transactions);
  };

  private page_positions = (
    account_id: string,
    page = 0,
    positions: position_partial_t[],
    len: number,
  ) =>
    len >= page_limit
      ? this.get_positions(account_id, page++, positions)
      : positions;

  private endpoints = {
    get: {
      positions: (account_id: string, page: number) =>
        `portfolio/${account_id}/positions/${page}`,
      position: (account_id: string, con_id: number) =>
        `portfolio/${account_id}/position/${con_id}`,
    },
    post: {
      transactions_history: (
        acctIds: string[],
        con_id: number,
        currency: currency_t,
        days: number,
      ): post_t => {
        const conids = [con_id];
        return {
          endpoint: `pa/transactions`,
          params: {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ acctIds, conids, currency, days }),
          },
        };
      },
      positions_invalidate_cache: (account_id: string) =>
        `portfolio/${account_id}/positions/invalidate`,
    },
  };
}
