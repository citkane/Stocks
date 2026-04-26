import { Global } from "backend";

const api = util.url.saxo;

export class Positions extends Global {
  public update = () => this.positions.fetch();

  private format = {
    data: (positions: b.s.positn_t[]) => {
      const pos_array = positions.map((p) => this.format.to_data(p));
      return pos_array.reduce(
        (c, pos) => {
          const { p_ids } = pos;
          c[p_ids[0]!] = pos;
          return c;
        },
        {} as { [p_id: p_id_t]: b.positn_t },
      );
    },
    to_data: (position: b.s.positn_t): b.positn_t => {
      const { PositionBase } = position;
      const { DisplayAndFormat } = position;
      //const { CurrentPrice: price_market } = PositionView;
      let {
        Symbol,
        Description: description,
        Currency: currency,
      } = DisplayAndFormat;
      const { Uic } = PositionBase;
      const p_id: p_id_t = `saxo_${Uic}`;

      let [ticker, exchange] = Symbol.split(":") as [string, string];
      exchange = this.saxo.exchgs.tv(exchange.toUpperCase());
      if (exchange === "HKEX") ticker = util.string.unpad_hk_ticker(ticker);
      description = util.string.title_case(description);

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
    fetch: async () => {
      const open_positns = await this.positions.fetch_open();
      const closed_i_ids = await this.positions.closed_p_ids(open_positns);
      const closed_positns = await this.positions
        //  .fetch_closed()
        //  .then((data) => logger.info(data));
        .fetch_closed(closed_i_ids)
        .then(this.positions.map_to_positions);
      const positns = [...open_positns, ...closed_positns];
      return this.format.data(positns);
    },
    fetch_open: (
      skip = 0,
      data_array: b.s.positn_t[] = [],
    ): Promise<b.s.positn_t[]> => {
      const query = this.endpoints.get.open_positions(skip);
      return this.saxo.fetch<b.s.data_t<b.s.positn_t>>(query).then((data) => {
        const count = !!data.Data ? data.Data.length : 0;
        data_array = [...data_array, ...(data.Data || [])];

        if (!data.__next) return data_array;
        return this.positions.fetch_open(skip + count, data_array);
      });
    },
    //fetch_closed: (
    //  skip = 0,
    //  data_array: b.s.positn_t[] = [],
    //): Promise<b.s.positn_t[]> => {
    //  const query = this.endpoints.get.closedpositions(skip);
    //  return this.saxo.fetch<b.s.data_t<b.s.positn_t>>(query).then((data) => {
    //    logger.info(query, data);
    //    const count = !!data.Data ? data.Data.length : 0;
    //    data_array = [...data_array, ...(data.Data || [])];
    //
    //    if (!data.__next) return data_array;
    //    return this.positions.fetch_open(skip + count, data_array);
    //  });
    //},
    // SAXO Api does NOT reliably deliver all closed positions.
    // We need to compare open positions against instruments in transactions
    // to find closed positions.
    //
    // @todo This will return NO closed positions on the initial run before the
    // db is populated with transactions.
    fetch_closed: async (
      i_ids: string[],
      skip = 0,
      data_array: b.s.instrument_t[] = [],
    ): Promise<b.s.instrument_t[]> => {
      if (!i_ids.length) return Promise.resolve([]);

      const query = this.endpoints.get.closed_positions(i_ids, skip);
      return this.saxo
        .fetch<b.s.data_t<b.s.instrument_t>>(query)
        .then((data) => logger.json("SAXO closed positions raw", data))
        .then((data) => {
          const count = !!data.Data ? data.Data.length : 0;
          data_array = [...data_array, ...(data.Data || [])];

          if (!data.__next) return data_array;
          return this.positions.fetch_closed(i_ids, skip + count, data_array);
        });
    },
    map_to_positions: (instruments: b.s.instrument_t[]) => {
      return instruments.map((instrument) => {
        const { Symbol, Description, Uic, CurrencyCode: Currency } = instrument;
        return {
          PositionBase: { Uic },
          PositionView: { CurrentPrice: 0 },
          DisplayAndFormat: { Symbol, Description, Currency },
        } as b.s.positn_t;
      });
    },
    closed_p_ids: async (positions: b.s.positn_t[]) => {
      const p_ids = positions.map((p) => `saxo_${p.PositionBase.Uic}`);
      const closed_p_ids = (await this.db.select.transctns("saxo"))
        .map((t) => t.p_id)
        .filter((p_id) => !p_ids.includes(p_id));

      return [...new Set(closed_p_ids).values()];
    },
  };

  private endpoints = {
    get: {
      open_positions: (skip: number) => {
        const grps = "PositionView,PositionBase,DisplayAndFormat";
        const params = [`$skip=${skip}`, `fieldGroups=${grps}`].join("&");
        return `${api.api}/positions/me?${params}`;
      },
      closed_positions: (i_ids: string[], skip: number) => {
        const Uics = i_ids.map((id) => id.split("_")[1]!).join(",");
        const params = [
          `AssetTypes=Stock,Etf`,
          `Uics=${Uics}`,
          `$skip=${skip}`,
        ].join("&");
        return `${api.ref}/instruments/details?${params}`;
      },
      closedpositions: (skip: number) => {
        const grps =
          "ClosedPosition,ClosedPositionDetails,DisplayAndFormat,ExchangeInfo";
        const params = [`$skip=${skip}`, `fieldGroups=${grps}`].join("&");

        return `${api.api}/closedpositions/me?${params}`;
      },
    },
  };
}
