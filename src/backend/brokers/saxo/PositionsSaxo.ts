import { Global } from "backend";

export class PositionsSaxo extends Global {
  public update = () => this.positions.fetch();

  private format = {
    to_positns: (positions: b.s.positn_t[]) => {
      const pos_array = positions.map((p) => this.format.to_positn(p));
      return pos_array.reduce(
        (c, pos) => {
          const { i_id } = pos;
          c[i_id] = pos;
          return c;
        },
        {} as { [i_id: i_id_t]: b.positn_t },
      );
    },
    to_positn: (position: b.s.positn_t): b.positn_t => {
      const { DisplayAndFormat, PositionBase } = position;
      const { Uic: saxo_id } = PositionBase;
      let {
        Symbol,
        Description: description,
        Currency: currency,
      } = DisplayAndFormat;
      currency = currency === "ZAR" ? "ZAC" : currency;

      let [ticker, exchange] = Symbol.split(":") as [string, string];
      exchange = this.saxo.tv_exchange(exchange.toUpperCase());
      if (exchange === "HKEX") ticker = util.string.unpad_hk_ticker(ticker);
      description = util.string.title_case(description);
      const i_id: i_id_t = `${exchange}-${ticker}`;

      return {
        saxo_id,
        i_id,
        currency,
        description,
      };
    },
    to_saxo_position: (trade: b.s.trade_t) => {
      let {
        InstrumentSymbol: Symbol,
        InstrumentDescription: Description,
        Uic,
      } = trade;
      return {
        PositionBase: { Uic },
        PositionView: { CurrentPrice: 0 },
        DisplayAndFormat: {
          Symbol,
          Description,
          Currency: "XXX" as currency_t,
        },
      } as b.s.positn_t;
    },
    trades_to_positions: (trades: b.s.trade_t[], positions: b.s.positn_t[]) => {
      const uics = [...positions.map((p) => p.PositionBase.Uic)];
      trades = trades.filter((t) => {
        if (uics.includes(t.Uic)) return false;
        uics.push(t.Uic);
        return true;
      });
      return trades.map(this.format.to_saxo_position);
    },
  };

  private positions = {
    fetch: async () => {
      const open_positns = await this.positions.fetch_open();
      logger.json("SAXO positions raw", open_positns);
      let trades = await this.positions.fetch_trades();
      const closed_positns = this.format.trades_to_positions(
        trades,
        open_positns,
      );
      //logger.json("SAXO trades", closed_uics);
      //const _closed_instruments =
      //  await this.positions.fetch_instruments(closed_uics);
      //const closed_positions =
      //  this.format.to_saxo_positions(_closed_instruments);
      logger.json("SAXO closed positions", closed_positns);
      //_closed_positns.forEach((p) => {
      //  const symbol = encodeURIComponent(p.InstrumentSymbol);
      //  this.positions
      //    .fetch_closed_uic(symbol)
      //    .then((data) => logger.info(data));
      //});
      //const closed_positns = this.format.to_saxo_positions(_closed_positns);
      //logger.json("SAXO closed positions", closed_positns);
      //const closed_i_ids = await this.positions.closed_p_ids(open_positns);
      //const closed_positns = await this.positions
      //  //  .fetch_closed()
      //  //  .then((data) => logger.info(data));
      //  .fetch_closed(closed_i_ids)
      //  .then((closed) => logger.json("SAXO closed positions", closed))
      //  .then(this.positions.map_to_positions);
      const positns = [...open_positns, ...closed_positns];
      return this.format.to_positns(positns);
    },
    fetch_open: (
      skip = 0,
      data_array: b.s.positn_t[] = [],
    ): Promise<b.s.positn_t[]> => {
      const query = this.saxo.endpoints.get.open_positions(skip);
      return this.saxo.fetch<b.s.data_t<b.s.positn_t>>(query).then((data) => {
        const count = !!data.Data ? data.Data.length : 0;
        data_array = [...data_array, ...(data.Data || [])];

        if (!data.__next) return data_array;
        return this.positions.fetch_open(skip + count, data_array);
      });
    },
    fetch_closed: (
      skip = 0,
      data_array: b.s.positn_closed_t[] = [],
    ): Promise<b.s.positn_closed_t[]> => {
      const query = this.saxo.endpoints.get.closed_positions(skip);
      return this.saxo
        .fetch<b.s.data_t<b.s.positn_closed_t>>(query)
        .then((data) => {
          const count = !!data.Data ? data.Data.length : 0;
          data_array = [...data_array, ...(data.Data || [])];

          if (!data.__next) return data_array;
          return this.positions.fetch_closed(skip + count, data_array);
        });
    },
    fetch_trades: (
      skip = 0,
      data_array: b.s.trade_t[] = [],
    ): Promise<b.s.trade_t[]> => {
      const query = this.saxo.endpoints.get.trades(skip);
      return this.saxo.fetch<b.s.data_t<b.s.trade_t>>(query).then((data) => {
        const count = !!data.Data ? data.Data.length : 0;
        data_array = [...data_array, ...(data.Data || [])];

        if (!data.__next) return data_array;
        return this.positions.fetch_trades(skip + count, data_array);
      });
    },
  };
}
