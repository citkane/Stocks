import { Money, Strings, Time, Html } from "@common/util/index";

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
    `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

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
}
