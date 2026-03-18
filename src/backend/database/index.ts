import { tables } from "./tables";

declare global {
  namespace db {
    type tables_t = typeof tables;
    type data_t = ibkr_t.transaction_t | account_t | position_t;
    type broker_n = keyof tables_t;
    type table_t<T extends broker_n, C extends table_n<T>> = tables_t[T][C];
    type table_n<T extends broker_n> = keyof tables_t[T];
    type col_t = [string, string];
    type col_n<T extends broker_n, C extends table_n<T>> = (tables_t[T][C] &
      readonly (readonly [string, string])[])[number][0];
    type con_t<T extends keyof tables_t, C extends keyof tables_t[T]> = [
      col_n<T, C>,
      "=" | "<" | ">",
      string | number,
    ];
    type sort_t<T extends broker_n, C extends table_n<T>> = [
      col_n<T, C>,
      "ASC" | "DESC",
    ];
    type ignore_t<T extends broker_n, C extends table_n<T>> = col_n<T, C>[];
  }
}

export * from "./Database.ts";
export { tables };
