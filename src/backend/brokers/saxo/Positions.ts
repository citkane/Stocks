import { Global } from "backend";

const paging_top = 100;
const api = "port/v1";
const { saxo } = conf;

type pos_t = saxo_t.position_t;

export default class Positions extends Global {
  public get_positions = (
    skip = 0,
    positions: pos_t[] = [],
  ): Promise<pos_t[]> =>
    this.saxo
      .fetch<saxo_t.positions_t>(this.endpoints.positions(skip))
      .then((data) =>
        !!data.__next
          ? this.get_positions(skip + paging_top, [...positions, ...data.Data])
          : [...positions, ...data.Data],
      );

  private endpoints = {
    positions: (skip: number) => {
      const params = [
        `ClientKey=${saxo.client_key}`,
        `$top=${paging_top}`,
        `$skip=${skip}`,
        "fieldGroups=DisplayAndFormat,ExchangeInfo,PositionView,PositionBase",
      ].join("&");
      return `${api}/positions?${params}`;
    },
    position: (id: string, client_key: string) =>
      `${api}//positions/${id}?ClientKey=${client_key}`,
  };
}
