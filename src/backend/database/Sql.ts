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
      const schema = this.snippets.table_schema(table);
      return sql.unsafe(`CREATE TABLE IF NOT EXISTS ${table} (${schema})`);
    },
    drop: (table: db.table_n) => {
      return sql`DROP TABLE IF EXISTS ${sql(table)};`;
    },
    insert: (table: db.table_n, values: db.data_t[]) => {
      const conflict = this.fragment.primary_conflict_sql(table);
      const statement = sql`INSERT INTO ${sql(table)} ${sql(values)} ${conflict}`;
      return statement;
    },
    update: <T extends db.table_n>(
      table: T,
      value: db.data_t,
      condition?: db.condition_t<T>,
    ) => {
      const cond = this.fragment.condition_sql(condition);
      return sql`UPDATE ${sql(table)} SET ${sql(value)} ${cond}`;
    },

    select: <T extends db.table_n>(
      table: T,
      condition?: db.condition_t<T>,
      sort?: db.sort_t<T>,
      ignore?: db.ignore_t<T>,
    ) => {
      const columns = this.fragment.columns_sql(table, ignore);
      const cond = this.fragment.condition_sql(condition);
      const sorter = this.fragment.sort_sql(sort);
      return sql`SELECT ${columns} FROM ${sql(table)} ${cond} ${sorter}`;
    },
    //count: (table: db.table_n) => {
    //  return sql`SELECT COUNT(*) FROM ${sql(table)}`
    //    .values()
    //    .then((data) => data[0][0]);
    //},
  };
  private fragment = {
    sort_sql: (sort?: db.sort_t<any>) => {
      if (!sort) return sql``;
      const [column, dir] = sort;
      const sort_string = `${column} ${dir}`;
      return sql`ORDER BY ${sql(sort_string)}`;
      //return sql.unsafe(str);
    },
    condition_sql: (condition?: db.condition_t<any>) => {
      if (!condition) return sql(``);
      const [col, operator, value] = condition;
      const condition_string = `${col} ${operator} ${value}`;
      return sql`WHERE ${sql(condition_string)}`;
    },

    columns_sql: <T extends keyof db.tables_t>(
      table: T,
      ignore: db.ignore_t<T> = [],
    ) => {
      const columns = this.table_cols(table)
        .filter((col) => !ignore.includes(col[0]!))
        .map((c) => c[0]!)
        .join(", ");
      return sql.unsafe(columns);
    },

    primary_conflict_sql: (table: db.table_n) => {
      const primary_row = this.table_cols(table).find((col) =>
        col[1].includes("PRIMARY KEY"),
      );
      if (!primary_row) return sql``;
      return sql`ON CONFLICT (${sql(primary_row[0])}) DO NOTHING`;
      //return sql.unsafe(str);
    },
  };
  private snippets = {
    table_schema: (table: db.table_n) => {
      const cols = this.table_cols(table);
      return cols
        .map((col) => {
          return `'${col[0]}' ${col[1]}`;
        })
        .join(", ");
    },
  };

  private table_cols = (table: db.table_n) => {
    return this.tables[table];
  };
}
