import { Tables } from "./Tables";

export class Sql extends Tables {
  protected sql = {
    create: (table: db.table_n) => {
      return `CREATE TABLE IF NOT EXISTS ${table} (${this.table_sql(table)})`;
    },
    drop: (table: db.table_n) => {
      return `DROP TABLE IF EXISTS ${table};`;
    },
    insert: (table: db.table_n, values: db.data_t[]) => {
      let str = `INSERT INTO ${table} VALUES ${this.values_sql(table, values)}`;
      const primary_key = this.primary_key(table);
      if (!!primary_key) str += ` ON CONFLICT (${primary_key}) DO NOTHING`;
      return `${str};`;
    },
    select: <T extends db.table_n>(
      table: T,
      condition?: db.condition_t<T>,
      sort?: db.sort_t<T>,
      ignore?: db.ignore_t<T>,
    ) => {
      const r = this.rows_sql(table, ignore);
      let str = `SELECT ${r} FROM ${table}`;
      if (!!condition) {
        condition[2] = `'${condition[2]}'`;
        const c = condition.join(" ");
        str += ` WHERE ${c}`;
      }
      if (!!sort) {
        const s = sort.join(" ");
        str += ` ORDER BY ${s}`;
      }
      return `${str};`;
    },
  };

  private values_sql = (table: db.table_n, data: db.data_t[]) => {
    const keys = this.tables[table].map((row) => row[0]);
    return data
      .map((item) =>
        keys.map((key) => this.value_to_sql((item as any)[key])).join(", "),
      )
      .map((row) => `(${row})`)
      .join(", ");
  };
  private value_to_sql(value: string | number) {
    return typeof value === "number" ? `${value}` : `'${value}'`;
  }

  private rows_sql = <T extends keyof db.tables_t>(
    table: T,
    ignore: db.ignore_t<T> = [],
  ) => {
    return this.table_cols(table)
      .filter((col) => !ignore.includes(col[0]!))
      .map((c) => c[0]!)
      .join(", ");
  };

  private table_sql = (table: db.table_n) => {
    const cols = this.table_cols(table);
    return cols.map((c) => `${c[0]} ${c[1]}`).join(", ");
  };

  private table_cols = (table: db.table_n) => {
    return this.tables[table];
  };

  private primary_key = (table: db.table_n) => {
    const primary_row = this.table_cols(table).find((col) =>
      col[1].includes("PRIMARY KEY"),
    );
    return primary_row ? primary_row[0] : undefined;
  };
}
