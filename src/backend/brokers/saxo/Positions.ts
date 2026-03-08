import { saxo } from "conf";
import type { Saxo } from "backend";
import type { saxo_t } from "types";

type pos_t = saxo_t.position_t;
const paging_top = 100;

export class Positions {
  constructor(private saxo: Saxo) {}

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

  private field_groups =
    "fieldGroups=DisplayAndFormat,ExchangeInfo,PositionView,PositionBase";
  private endpoints = {
    positions: (skip: number) =>
      `positions?ClientKey=${saxo.client_key}&${this.field_groups}&$top=${paging_top}&$skip=${skip}`,
    position: (id: string, client_key: string) =>
      `positions/${id}?ClientKey=${client_key}`,
  };
}
