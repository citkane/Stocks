import { ibkr as conf } from "../../../../conf.json";
import { util } from "../../../Util";

import type { Ibkr } from "..";
import type { ibkr_t } from "../../../types";

type post_t = { endpoint: string; params: RequestInit };
type position_partial_t = Partial<ibkr_t.position_t> | ibkr_t.position_t;

const page_limit = 100;

export class Positions {
  constructor(private ibkr: Ibkr) {}

  public get_positions = (
    account_id: string,
    page = 0,
    positions: position_partial_t[] = [],
  ): Promise<position_partial_t[]> =>
    this.ibkr
      .fetch(this.endpoints.get.positions(account_id, page))
      .then((res) => res.json())
      .then((_positions: position_partial_t[]) =>
        this.page_positions(
          account_id,
          page,
          [...positions, ..._positions],
          _positions.length,
        ),
      );

  public get_position = (account_id: string, con_id: number) =>
    this.ibkr
      .fetch(this.endpoints.get.position(account_id, con_id))
      .then((res) => res.json())
      .then((position: ibkr_t.position_t) => position);

  public transactions_history = (
    account_ids: string[],
    con_id: number,
    currency: currency_t,
  ) => {
    const { endpoint, params } = this.endpoints.post.transactions_history(
      account_ids,
      con_id,
      currency,
      util.aging_days(conf.start_date),
    );
    return this.ibkr
      .fetch(endpoint, params)
      .then((res) => res.json())
      .then((transactions: ibkr_t.transactions_t) => transactions.transactions);
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
