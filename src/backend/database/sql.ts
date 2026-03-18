import { tables } from ".";

export const sql = {
  create: <T extends db.broker_n>(broker: T, table: db.table_n<T>) => {
    return `CREATE TABLE IF NOT EXISTS ${table_name(broker, table)} (${table_sql(broker, table)})`;
  },
  drop: <T extends db.broker_n>(broker: T, table: db.table_n<T>) => {
    return `DROP TABLE IF EXISTS ${table_name(broker, table)};`;
  },
  insert: <T extends db.broker_n>(
    broker: T,
    table: db.table_n<T>,
    values: db.data_t[],
  ) => {
    return `INSERT INTO ${table_name(broker, table)} VALUES ${values_sql(values)} ON CONFLICT (${primary_key(broker, table)}) DO NOTHING;`;
  },
  select: <T extends db.broker_n, C extends db.table_n<T>>(
    broker: T,
    table: C,
    condition: db.con_t<T, C>,
    sort: db.sort_t<T, C>,
    ignore: db.ignore_t<T, C> = [],
  ) => {
    condition[2] = `'${condition[2]}'`;
    const c = condition.join(" ");
    const r = rows_sql(broker, table, ignore);
    const n = table_name<T>(broker, table);
    const s = sort.join(" ");
    return `SELECT ${r} FROM ${n} WHERE ${c} ORDER BY ${s};`;
  },
};

function values_sql(values: db.data_t[]) {
  return values
    .map((value) => {
      const key = Object.keys(value)[0]! as keyof db.data_t;
      return value_to_sql(key, value[key]!);
    })
    .join(", ");
}
function value_to_sql(key: string, value: string | number) {
  return typeof value === "number" ? `${key} ${value}` : `${key} '${value}'`;
}

function rows_sql<T extends keyof db.tables_t>(
  broker: T,
  table: db.table_n<T>,
  ignore: string[] = [],
) {
  return table_cols(broker, table)
    .filter((col) => !ignore.includes(col[0]!))
    .map((c) => c[0]!)
    .join(", ");
}

function table_sql<T extends db.broker_n, C extends db.table_n<T>>(
  broker: T,
  table: C,
) {
  const rows = table_cols<T, C>(broker, table);
  return rows.map((c) => `${c[0]} ${c[1]}`).join(", ");
}

function table_cols<T extends db.broker_n, C extends db.table_n<T>>(
  broker: T,
  table: C,
) {
  return tables[broker][table] as [string, string][];
}

function table_name<T extends db.broker_n>(
  broker: db.broker_n,
  table: db.table_n<T>,
) {
  return `${broker}_${table as string}`;
}

function primary_key<T extends db.broker_n>(broker: T, table: db.table_n<T>) {
  return table_cols(broker, table).find((col) =>
    col[1].includes("PRIMARY KEY"),
  )![0];
}
