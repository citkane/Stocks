import { Global } from "backend";

const page_limit = 100;
const max_batch = 100;

const { ibkr: url } = util.url;

export class Positions extends Global {
  public update = (acc_ids: string[]) =>
    this.positions
      .fetch(acc_ids)
      .then((p) => logger.json("IBKR positions raw", p));
  public market_view = (con_ids: number[]) =>
    this.market
      .fetch(con_ids)
      .then((m) => logger.json("IBKR market raw", m))
      .then(this.market.reduce.batches)
      .then((m) => logger.json("IBKR market view", m));

  private market = {
    fetch: (con_ids: number[]) => {
      const uri_accounts_preflight = this.endpoints.get.preflight_accounts();
      const batches = this.market.batch(con_ids);
      return this.ibkr
        .fetch(uri_accounts_preflight)
        .then(() => this.market.fetch_batches(batches));
    },
    fetch_batches: (batches: number[][]) => {
      return Promise.all(
        batches.map((batch) => this.market.fetch_batch(batch)),
      );
    },
    fetch_batch: (con_ids: number[]) => {
      const uri_market = this.endpoints.get.market(con_ids);

      return this.ibkr
        .fetch<b.i.market_data_t[]>(uri_market)
        .then(this.market.reduce.data);
    },
    batch: (con_ids: number[], batches = [] as number[][]): number[][] => {
      con_ids = structuredClone(con_ids);
      const batch = con_ids.splice(0, max_batch - 1);
      batches.push(batch);

      return con_ids.length ? this.market.batch(con_ids, batches) : batches;
    },
    reduce: {
      batches: (views: Map<string, b.market_view_t>[]) => {
        return views.reduce((c, view) => {
          view.entries().forEach((entry) => c.set(entry[0], entry[1]));
          return c;
        }, new Map<string, b.market_view_t>());
      },
      data: (data: b.i.market_data_t[]) => {
        return data.reduce((c, data) => {
          const { conid } = data;
          const view = this.market.reduce.fields(data);

          c.set(`ibkr_${conid}`, view);
          return c;
        }, new Map<string, b.market_view_t>());
      },
      fields: (data: b.i.market_data_t) => {
        return Object.keys(market_fields).reduce((c, key) => {
          const field = market_fields[key]!;
          let value = data[key as keyof b.i.market_data_t];
          if (field === "price_market") {
            value = Number((value as string).replace("C", "").replace("H", ""));
          }

          c = { ...c, ...{ [field]: value } };
          return c;
        }, {} as b.market_view_t);
      },
    },
  };
  private positions = {
    fetch: (acc_ids: string[]) => {
      return Promise.all(acc_ids.map((a_id) => this.positions.get(a_id))).then(
        (positions) => positions.flat(),
      );
    },
    get: (a_id: string, page = 0, pos: b.i.position_t[] = []) =>
      this.ibkr
        .fetch<b.i.position_t[]>(this.endpoints.get.positions(a_id, page))
        .then((_pos) => this.positions.page(a_id, page, [...pos, ..._pos])),
    page: (
      a_id: string,
      page = 0,
      pos: b.i.position_t[],
    ): Promise<b.i.position_t[]> =>
      pos.length >= page_limit
        ? this.positions.get(a_id, page++, pos)
        : Promise.resolve(pos),
  };
  private endpoints = {
    get: {
      positions: (a_id: string, page: number) => {
        return `${url.api}/portfolio/${a_id}/positions/${page}`;
      },
      market: (con_ids: number[]) => {
        const fields = Object.keys(market_fields);
        const _url = `${url.api}/iserver/marketdata/snapshot`;
        const params = `?conids=${con_ids.join(",")}&fields=${fields.join(",")}`;
        return `${_url}${params}`;
      },
      preflight_accounts: () => {
        return `${url.api}/iserver/accounts`;
      },
    },
  };
}

const market_fields: { [key: string]: keyof b.market_view_t } = {
  "55": "ticker",
  "31": "price_market",
  "7221": "exchange",
  "7051": "description",
  "7280": "industry",
  "7281": "category",
} as const;

declare global {
  namespace b {
    namespace i {
      type market_data_t = {
        conidEx: string;
        conid: number;
        _updated: number;
        server_id: string;
      } & { [key: string]: keyof typeof market_fields };
    }
  }
}
