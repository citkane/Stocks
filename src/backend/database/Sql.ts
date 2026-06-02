import { mkdirSync, existsSync } from "fs";
import { SQL } from "bun";
import { Global } from "@backend/Global";
import { Tables } from "./Tables";

const db_dir = ".sqlite";
const brokers_db = `${db_dir}/brokers.sqlite`;
const charts_db = `${db_dir}/charts.sqlite`;

let sql: Bun.SQL;
let sql_c: Bun.SQL;

await init_db();

export class Sql extends Global {
  constructor() {
    super();
  }
  protected sql = {
    create: (table: db.table_n, _sql = sql) => {
      const schema = this.snippets.table_schema(table);
      return _sql
        .unsafe(`CREATE TABLE IF NOT EXISTS ${table} (${schema})`)
        .execute();
    },
    drop: (table: db.table_n) => {
      return sql`DROP TABLE IF EXISTS ${sql(table)};`;
    },
    insert: <T extends db.table_n>(table: T, values: db.data_t<T>[]) => {
      if (!values.length) return Promise.resolve([]);
      const conflict = this.fragment.primary_conflict_sql(table);
      const statement = sql`INSERT INTO ${sql(table)} ${sql(values)} ${conflict}`;
      return statement;
    },
    rename: (old_name: string, new_name: string, _sql = sql) => {
      return _sql`ALTER TABLE ${_sql(old_name)} RENAME TO ${_sql(new_name)}`;
    },
    update: <T extends db.table_n>(
      table: T,
      value: db.data_t<T>,
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
      max?: db.col_n<T>,
    ) => {
      const columns = this.fragment.columns_sql(table, ignore);
      const cond = this.fragment.condition_sql(condition);
      const sorter = this.fragment.sort_sql(sort);
      return max
        ? sql`SELECT MAX(${sql(max)}) AS ${sql(max)} FROM ${sql(table)} ${cond}`
        : sql`SELECT ${columns} FROM ${sql(table)} ${cond} ${sorter}`;
    },
    exists: (id: string, _sql = sql) =>
      _sql`SELECT name FROM sqlite_master WHERE type='table' AND name=${_sql(id)}`.then(
        (res) => (!!res[0] ? true : false),
      ),
    insert_chart: (table: string, values: chart_data_t[]) =>
      this.sql.exists(table, sql_c).then((exists) =>
        exists
          ? sql_c`INSERT INTO ${sql_c(table)} ${sql_c(values)} ON CONFLICT (${sql_c("time")}) DO NOTHING`
          : this.sql
              .create("charts_", sql_c)
              .then(() => this.sql.rename("charts_", table, sql_c))
              .then(() => sql_c`INSERT INTO ${sql_c(table)} ${sql_c(values)}`),
      ),
    select_chart: (id: string) =>
      this.sql
        .exists(id, sql_c)
        .then((exists) =>
          exists
            ? (sql_c`SELECT * FROM ${sql_c(id)} ORDER BY ${sql_c("time")} ASC` as Promise<
                chart_data_t[]
              >)
            : null,
        ),
  };
  private fragment = {
    sort_sql: (sort?: db.sort_t<any>) => {
      if (!sort) return sql``;
      const [column, dir] = sort;
      return sql.unsafe(`ORDER BY ${column} ${dir}`);
    },
    condition_sql: (condition?: db.condition_t<any>) => {
      if (!condition) return sql(``);
      const [col, value] = condition;
      return sql`WHERE ${sql(col)} IN ${sql([value])}`;
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
        (col[1] as string)?.includes("PRIMARY KEY"),
      );
      if (!primary_row) return sql``;
      return sql`ON CONFLICT (${sql(primary_row[0])}) DO NOTHING`;
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

  private get tables() {
    return Tables.tables;
  }
}

async function init_db() {
  !existsSync(db_dir) && mkdirSync(db_dir);

  const options = {
    adapter: "sqlite",
    create: true,
    strict: true,
  } as SQL.Options;

  sql = new SQL({
    filename: brokers_db,
    ...options,
  });
  sql_c = new SQL({
    filename: charts_db,
    ...options,
  });

  const instrmnt_view = Tables.views.instruments;
  const location_view = Tables.views.location_search;
  await sql.unsafe(instrmnt_view).execute();
  await sql.unsafe(location_view).execute();

  const table_names = Tables.table_names.filter((name) => {
    return !Tables.view_names.includes(name) && !name.endsWith("_");
  }) as db.table_n[];
  await Promise.all(table_names.map(table_schema));

  function table_schema(table_name: db.table_n) {
    const table_rows = Tables.tables[table_name]!;
    const schema = table_rows.map((col) => `'${col[0]}' ${col[1]}`).join(", ");
    return sql
      .unsafe(`CREATE TABLE IF NOT EXISTS ${table_name} (${schema})`)
      .execute();
  }
}
