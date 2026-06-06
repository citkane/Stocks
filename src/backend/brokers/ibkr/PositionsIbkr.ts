import { Global } from "@backend/Global";
import type { EndpointsIbkr as fetch_t } from "./EndpointsIbkr";

export class PositionsIbkr extends Global {
  constructor(
    private fetch: fetch_t["fetch"],
    private get: fetch_t["get"],
    private post: fetch_t["post"],
  ) {
    super();
  }
  public update = (acc_ids: string[]) => {
    return this.positions.fetch_new(acc_ids).then(this.format.data);
  };

  private format = {
    data: (positions: b.i.positn_t[]) => {
      const pos_array = positions.map((p) => this.format.to_data(p));
      return pos_array.reduce(
        (c, pos) => {
          const { i_id } = pos;
          c[i_id] = pos;
          return c;
        },
        {} as { [i_id: i_id_t]: b.positn_t },
      );
    },
    to_data: (position: b.i.positn_t): b.positn_t => {
      let {
        conid: ibkr_id,
        ticker,
        name: description,
        listingExchange: exchange,
        countryCode,
        currency,
      } = position;

      exchange = this.ibkr.tv_exchange(exchange, countryCode);
      if (exchange === "HKEX") ticker = util.string.unpad_hk_ticker(ticker);
      description = util.string.title_case(description);
      const i_id: i_id_t = `${exchange}-${ticker}`;

      return {
        ibkr_id: Number(ibkr_id),
        i_id,
        currency,
        description,
      };
    },
  };

  private positions = {
    fetch_new: async (acc_ids: string[]) => {
      const positns = await Promise.all(
        acc_ids.map((a_id) => this.positions.fetch_for_accnt(a_id)),
      ).then((positions) => positions.flat());
      logger.json("IBKR positions raw", positns);
      return positns;
    },
    fetch_for_accnt: async (a_id: string) => {
      const new_conids = await this.positions.get_new_conids(a_id);
      // IBKR does NOT reliably respond with all fields for a position.
      // We pump the endpoint until it does.
      //const try_fetch = (con_id: number): Promise<b.i.positn_t[]> => {
      //  const url = this.ibkr.endpoints.request.position(a_id, con_id);
      //  return this.ibkr.fetch<b.i.positn_t[]>(url).then((p) => {
      //    const { name, listingExchange: ex, countryCode: cc } = p[0]!;
      //    if (!!name && !!ex && !!cc) return p;
      //
      //    const err_data = JSON.stringify({ name, ex, cc });
      //    const err_m = `Missing position data for ${con_id}: ${err_data}`;
      //    return this.ibkr.retry_fetch(() => try_fetch(con_id), err_m);
      //  });
      //};
      // We pump each position until a full response is received.
      return Promise.all(
        new_conids.map((conid) => this.positions.fetch_position(a_id, conid)),
      ).then((ps) => ps.flat());
    },
    fetch_position: async (a_id: string, conid: number) => {
      const req = this.get.position(a_id, conid);
      const positn = await this.fetch<b.i.positn_t>(req);
      console.log(positn);
      return positn;
    },
    // The IBKR positions endpoint does not reliably return a full data payload for each position.
    // We extract all new conids, and then fetch each position individually.
    get_new_conids: (a_id: string) => {
      const req = this.get.positions(a_id);
      return this.fetch<b.i.positn_t[]>(req).then(
        reduce_to_new_conids.bind(this),
      );

      async function reduce_to_new_conids(
        this: PositionsIbkr,
        positions: b.i.positn_t[],
      ) {
        return positions.reduce((conids, postn) => {
          const { conid } = postn;
          const ex_instrmnt = this.ibkr.cache.get.instrument(Number(conid));
          if (!!ex_instrmnt) return conids;
          conids.push(Number(conid));
          return conids;
        }, [] as number[]);
      }
    },
  };
}
