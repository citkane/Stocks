import { Global } from "backend";

const { client_key } = conf.saxo;
const api = util.url.saxo;

export class Positions extends Global {
  constructor() {
    super();
  }
  public update = () =>
    this.fetch().then((p) => logger.json("SAXO positions raw", p));
  public market_view = (positions: b.s.position_t[]) =>
    Promise.resolve(this.market.reduce(positions)).then((m) =>
      logger.json("SAXO market view", m),
    );

  //public info = (uic: number) => {
  //  const query = this.endpoints.info(uic);
  //  console.log(query);
  //  this.saxo.fetch(query).then((data) => console.log(data));
  //};

  private market = {
    reduce: (positions: b.s.position_t[]) => {
      return positions.reduce((c, position) => {
        const { PositionId: id, PositionView } = position;
        const { CurrentPrice: price_market } = PositionView;
        c.set(`saxo_${id}`, {
          price_market,
        });
        return c;
      }, new Map<string, {}>() as b.market_view_map_t);
    },
  };
  private fetch = (
    skip = 0,
    positions: b.s.position_t[] = [],
  ): Promise<b.s.position_t[]> => {
    const query = this.endpoints.positions(skip);

    return this.saxo.fetch<b.s.positions_t>(query).then((data) => {
      const count = data.Data.length;
      return count > 0
        ? this.fetch(skip + count, [...positions, ...data.Data])
        : [...positions, ...data.Data];
    });
  };

  private endpoints = {
    positions: (skip: number) => {
      const field_groups = "PositionView";
      const params = [
        `ClientKey=${client_key}`,
        `$skip=${skip}`,
        `fieldGroups=${field_groups}`,
      ].join("&");
      return `${api.api}/positions?${params}`;
    },
    // info: (uic: number) => {
    //   const field_groups = "MarketData";
    //
    //   const params = [`FieldGroups=${field_groups}`].join("&");
    //
    //   return `${api.ref}/instruments/details/${uic}/Stock?${params}`;
    // },
  };
}
