import { Database as Db } from "bun:sqlite";
import { sql } from "./sql";

type count_t = { [key: string]: number };
//type collect_t = { [key: string]: string };

export class Database {
  constructor() {
    this.db.query(sql.create("ibkr", "transactions")).run();
  }
  select = {
    ibkr_transactions: (conid: number) =>
      this.db
        .query(sql.select("ibkr", "transactions", `conid = ${conid}`, ["id"]))
        .all() as ibkr_t.transaction_t[],
  };
  insert = {
    ibkr_transactions: (transactions: ibkr_t.transaction_t[]) =>
      this.db
        .query(
          sql.insert(
            "ibkr",
            "transactions",
            transactions.map((t, i) => map_transaction_id(t, i)),
          ),
        )
        .run(),
  };
  //
  //select_transactions(conid: number) {
  //  const query = `SELECT ${ibkr_transaction_cols.join(", ")} FROM ibkr_transactions WHERE conid = ${conid};`;
  //  return this.db.query(query).all() as ibkr_t.transaction_t[];
  //}
  //insert_transactions(transactions: ibkr_t.transaction_t[]) {
  //  const count: count_t = {};
  //  const rows = Object.values(
  //    transactions.reduce((c, t) => {
  //      const id = transaction_id(t, count);
  //      const row = JSON.stringify([
  //        id,
  //        ibkr_transaction_cols.map((key) => t[key as keyof typeof t]),
  //      ])
  //        .replaceAll('"', "'")
  //        .replace("[", "(")
  //        .replace("]", ")");
  //      c[id] = row;
  //      return c;
  //    }, {} as collect_t),
  //  ).join(",");
  //  const query = `INSERT INTO ibkr_transactions VALUES ${rows} ON CONFLICT (id) DO NOTHING;`;
  //  this.db.query(query).run();
  //}
  private db = new Db("stocks.sqlite", { create: true });
}

let count: count_t;
function map_transaction_id(t: ibkr_t.transaction_t, i: number) {
  if (i === 0) count = {};
  (t as any).id = transaction_id(t, count);
  return t;
}
function transaction_id(transaction: ibkr_t.transaction_t, count: count_t) {
  const { conid, rawDate, acctid, type, amt } = transaction;
  let id = `${conid}_${acctid}_${rawDate}_${type}_${amt}`;
  if (!count[id]) count[id] = 0;
  id = `${id}_${count[id]}`;
  count[id]!++;
  return id;
}
