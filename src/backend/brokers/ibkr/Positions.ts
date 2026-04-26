import { Global } from "backend";
const { ibkr: url } = util.url;

export class Positions extends Global {
  public update = (acc_ids: string[]) =>
    this.positions.fetch(acc_ids).then(this.format.data);

  private format = {
    data: (positions: b.i.positn_t[]) => {
      const pos_array = positions.map((p) => this.format.to_data(p));
      return pos_array.reduce(
        (c, pos) => {
          const { p_ids } = pos;
          //const i_id: i_id_t = `${exchange}-${ticker}`;
          c[p_ids[0]!] = pos;
          return c;
        },
        {} as { [p_id: p_id_t]: b.positn_t },
      );
    },
    to_data: (position: b.i.positn_t): b.positn_t => {
      let {
        conid,
        ticker,
        name: description,
        listingExchange: exchange,
        countryCode,
        currency,
      } = position;

      exchange = this.ibkr.exchgs.tv(exchange, countryCode);
      if (exchange === "HKEX") ticker = util.string.unpad_hk_ticker(ticker);
      description = util.string.title_case(description);
      const p_id: p_id_t = `ibkr_${conid}`;

      return {
        p_ids: [p_id],
        ticker,
        exchange,
        currency,
        description,
      };
    },
  };

  private positions = {
    fetch: (acc_ids: string[]) => {
      return Promise.all(acc_ids.map((a_id) => this.positions.get(a_id))).then(
        (positions) => positions.flat(),
      );
    },
    get: async (a_id: string) => {
      const conids = await this.positions.get_conids(a_id);
      // IBKR does NOT reliably respond with all fields for a position.
      // We retry  the endpoint until it does.
      const try_fetch = (con_id: string): Promise<b.i.positn_t[]> => {
        const url = this.endpoints.get.position(a_id, con_id);
        return this.ibkr.fetch<b.i.positn_t[]>(url).then((p) => {
          const { name, listingExchange: ex, countryCode: cc } = p[0]!;
          if (!!name && !!ex && !!cc) return p;

          const err_data = JSON.stringify({ name, ex, cc });
          const err_m = `Missing position data for ${con_id}: ${err_data}`;
          return this.ibkr.retry_fetch(() => try_fetch(con_id), err_m);
        });
      };
      // We pump each position until a full response is received.
      return Promise.all(conids.map(try_fetch)).then((ps) => ps.flat());
    },
    // The IBKR positions endpoint does not reliably return a full data payload for each position.
    // We extract all conids, and then fetch each position individually.
    get_conids: (a_id: string) => {
      const url = this.endpoints.get.positions(a_id);
      return this.ibkr
        .fetch<b.i.positn_t[]>(url)
        .then((ps) => ps.map((p) => String(p.conid)));
    },
  };

  private endpoints = {
    get: {
      positions: (a_id: string) => {
        return `${url.api}/portfolio2/${a_id}/positions`;
      },
      position: (a_id: string, con_id: string) => {
        return `${url.api}/portfolio/${a_id}/position/${con_id}`;
      },
    },
  };
}
