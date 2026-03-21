import { SQL } from "bun";
import { Tables } from "./Tables";

let sql: SQL;

export class Sql extends Tables {
  constructor(sql_file: string) {
    super();
    sql = new SQL({
      adapter: "sqlite",
      filename: sql_file,
      create: true,
      strict: true,
    });
  }
  protected sql = {
    create: (table: db.table_n) => {
      if (table === "fx_rates") console.log(this.table_sql(table));
      const table_data = sql`(${this.table_sql(table)})`;
      return sql`CREATE TABLE IF NOT EXISTS ${sql(table)} ${table_data}`
        .then(() => sql`PRAGMA table_info(${sql(table)})`)
        .then((c) => console.log(c));
    },
    drop: (table: db.table_n) => {
      return sql`DROP TABLE IF EXISTS ${sql(table)};`;
    },
    insert: (table: db.table_n, values: db.data_t[]) => {
      return sql`INSERT INTO ${sql(table)} ${sql(values)} ${this.primary_conflict_sql(table)}`;
    },
    select: <T extends db.table_n>(
      table: T,
      condition?: db.condition_t<T>,
      sort?: db.sort_t<T>,
      ignore?: db.ignore_t<T>,
    ) => {
      const columns = this.columns_sql(table, ignore);
      const cond = this.condition_sql(condition);
      const sorter = this.sort_sql(sort);
      return sql`SELECT ${columns} FROM ${sql(table)} ${cond} ${sorter}`;
    },
  };
  private sort_sql = (sort?: db.sort_t<any>) => {
    if (!sort) return sql``;
    const [column, dir] = sort;
    const str = `ORDER BY ${column} ${dir}`;
    return sql(str);
  };
  private condition_sql = (condition?: db.condition_t<any>) => {
    if (!condition) return sql``;
    const [col, operator, value] = condition;
    const str = `WHERE ${col} ${operator} ${value}`;
    return sql(str);
  };

  private columns_sql = <T extends keyof db.tables_t>(
    table: T,
    ignore: db.ignore_t<T> = [],
  ) => {
    const columns = this.table_cols(table)
      .filter((col) => !ignore.includes(col[0]!))
      .map((c) => c[0]!)
      .join(", ");
    return sql(columns);
  };

  private table_sql = (table: db.table_n) => {
    const cols = this.table_cols(table);
    const str = `${cols.map((c) => `${c[0]} ${c[1]}`).join(", ")}`;
    return sql(str);
  };

  private primary_conflict_sql = (table: db.table_n) => {
    const primary_row = this.table_cols(table).find((col) =>
      col[1].includes("PRIMARY KEY"),
    );
    if (!primary_row) return sql``;
    const str = `ON CONFLICT (${primary_row[0]}) DO NOTHING`;
    return sql(str);
  };
  private table_cols = (table: db.table_n) => {
    return this.tables[table];
  };
}
