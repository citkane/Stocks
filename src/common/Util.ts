import { Money, Strings, Time, Html } from "@common/util/index";
//import { randomUUIDv7 } from "bun";

export class Util {
  static string = new Strings();
  static time = new Time();
  static money = new Money();
  static html = new Html();
  static resolver = {
    empty: (): resolver_t => {
      return { resolve: () => {}, reject: () => {} };
    },
  };
  static colours = {
    red: "#ef5350",
    green: "#26a69a",
    blue: "#3179F5",
  };
  static csv = {
    to_data: (csv: string) => {
      return csv
        .trim()
        .split("\n")
        .map((l) => {
          l = l
            .trim()
            .replace(/[^,]"[^,|$]/g, '\\"')
            .replace(/,(?=,|$)/g, ',""');
          return JSON.parse(`[${l}]`);
        }) as string[][];
    },
  };
  static random_context = () =>
    `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; //`${randomUUIDv7("base64url", Date.now())}`;

  static hash_id = (data: string | Object, length = 16) => {
    const _data: string =
      typeof data === "object" ? JSON.stringify(data) : data;
    let hash = 2166136261;
    for (let i = 0; i < _data.length; i++) {
      hash ^= _data.charCodeAt(i);
      hash *= 16777619;
      hash >>>= 0;
    }
    let id = hash.toString(36);
    while (id.length < length) {
      id = id + Math.abs(hash ^ id.length).toString(36);
    }
    return id.substring(0, length);
  };
  //static get url() {
  //  return {
  //    saxo: {
  //      api: `${conf.saxo.url.base}/${conf.saxo.url.endpoints.api}`,
  //      auth: `${conf.saxo.url.auth}`,
  //      chart: `${conf.saxo.url.base}/${conf.saxo.url.endpoints.chart}`,
  //      history: `${conf.saxo.url.base}/${conf.saxo.url.endpoints.history}`,
  //      ref: `${conf.saxo.url.base}/${conf.saxo.url.endpoints.ref}`,
  //      trade: `${conf.saxo.url.base}/${conf.saxo.url.endpoints.trade}`,
  //      client_services: `${conf.saxo.url.base}/${conf.saxo.url.endpoints.client_services}`,
  //    },
  //    ibkr: {
  //      api: `${conf.ibkr.url.base}/${conf.ibkr.url.endpoints.api}`,
  //      login: `${conf.ibkr.url.base}`,
  //    },
  //  };
  //}
}
