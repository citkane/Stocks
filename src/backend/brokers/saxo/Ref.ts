import { Global } from "backend";

const { saxo: url } = util.url;

export class Ref extends Global {
  public exchanges = (
    skip = 0,
    data = [] as b.s.exchg_t[],
  ): Promise<b.s.exchg_t[]> => {
    const url = this.endpoints.exchanges(skip);
    return this.saxo
      .fetch<b.s.data_envelope_t<b.s.exchg_t>>(url)
      .then((_data) => {
        data = [...data, ..._data.Data];
        return !_data.__next ? data : this.exchanges(_data.Data.length, data);
      });
  };

  private endpoints = {
    exchanges: (skip: number = 0) => `${url.ref}/exchanges?$skip=${skip}`,
  };
}
