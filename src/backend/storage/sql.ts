export const sql = {
  create: (broker: keyof columns_t, table: keyof columns_t[typeof broker]) => {
    const cols = columns[broker]![table]!;
    const cols_sql = cols.map((c) => `${c[0]} ${c[1]}`).join(", ");
    return `CREATE TABLE IF NOT EXISTS ${broker}_${table} (${cols_sql})`;
  },
  insert: (
    broker: keyof columns_t,
    table: keyof columns_t[typeof broker],
    values: {}[],
  ) => {
    const cols = columns[broker]![table]!.map((c) => c[0]!);
    const rows = values.map((row) =>
      cols
        .map((c) => {
          const key = c as keyof typeof row;
          const val = row[key]!;
          return typeof val === "number" ? `${key} ${val}` : `${key} '${val}'`;
        })
        .join(", "),
    );
    return `INSERT INTO ${broker}_${table} VALUES ${rows} ON CONFLICT DO NOTHING;`;
  },
  select: (
    broker: keyof columns_t,
    table: keyof columns_t[typeof broker],
    condition: string,
    ignore: string[] = [],
  ) => {
    const cols = columns[broker]![table]!.filter(
      (col) => !ignore.includes(col[0]!),
    )
      .map((c) => c[0]!)
      .join(", ");
    return `SELECT ${cols} FROM ${broker}_${table} WHERE ${condition};`;
  },
};

//  insert_transactions(transactions: ibkr_t.transaction_t[]) {
//    const count: count_t = {};
//    const rows = Object.values(
//      transactions.reduce((c, t) => {
//        const id = transaction_id(t, count);
//        const row = JSON.stringify([
//          id,
//          ibkr_transaction_cols.map((key) => t[key as keyof typeof t]),
//        ])
//          .replaceAll('"', "'")
//          .replace("[", "(")
//          .replace("]", ")");
//        c[id] = row;
//        return c;
//      }, {} as collect_t),
//    ).join(",");
//    const query = `INSERT INTO ibkr_transactions VALUES ${rows} ON CONFLICT (id) DO NOTHING;`;
//    this.db.query(query).run();
//  }
//
//
type columns_t = typeof columns;
const columns = {
  ibkr: {
    transactions: [
      ["id", "VARCHAR PRIMARY KEY"],
      ["conid", "INT"],
      ["cur", "CHAR(3) NOT NULL"],
      ["date", "DATETIME NOT NULL"],
      ["fxRate", "DECIMAL(38,5) NOT NULL"],
      ["pr", "DECIMAL(38,2)"],
      ["qty", "SMALLINT"],
      ["acctid", "VARCHAR NOT NULL"],
      ["amt", "DECIMAL(38,5) NOT NULL"],
      ["type", "VARCHAR NOT NULL"],
      ["desc", "VARCHAR NOT NULL"],
    ],
  },
};

//function row_template<T = brokers_t>(broker: brokers_t, table: tables_t<T>){
//	return cols.map(v => )
//}

//    table: `CREATE TABLE IF NOT EXISTS ibkr_transactions (
//	id VARCHAR PRIMARY KEY,
//	conid INT,
//	cur CHAR(3) NOT NULL,
//	date DATETIME NOT NULL,
//	fxRate DECIMAL(38,5) NOT NULL,
//	pr DECIMAL(38,2),
//	qty SMALLINT,
//	acctid VARCHAR NOT NULL,
//	amt DECIMAL(38,5) NOT NULL,
//	type VARCHAR NOT NULL,
//	desc VARCHAR NOT NULL
//);`
