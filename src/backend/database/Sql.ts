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
  protected sql = {
    create: (table: db.tbl.names, _sql = sql) => {
      const schema = this.snippets.table_schema(table);
      return _sql
        .unsafe(`CREATE TABLE IF NOT EXISTS ${table} (${schema})`)
        .execute();
    },
    drop: (table: db.tbl.names) => {
      return sql`DROP TABLE IF EXISTS ${sql(table)};`;
    },
    insert: async <T extends db.tbl.names>(table: T, values: db.data<T>[]) => {
      if (!values.length) return;

      values = this.has_json(table)
        ? this.stringify_json<db.data<T>[]>(values)
        : values;
      const conflict = this.fragment.primary_conflict(table);
      return sql`INSERT INTO ${sql(table)} ${sql(values)} ${conflict}`;
    },
    //insert_json: async <T extends db.tbl.names<"json">>(
    //  table: T,
    //  values: db.data<T>[],
    //) => {
    //  if (!values.length) return [];
    //  values = this.stringify_json<T>(values);
    //  const conflict = this.fragment_sql.primary_conflict_sql(table);
    //  return sql`INSERT INTO ${sql(table)} ${sql(values)} ${conflict}`;
    //},
    rename: (old_name: string, new_name: string, _sql = sql) => {
      return _sql`ALTER TABLE ${_sql(old_name)} RENAME TO ${_sql(new_name)}`;
    },
    update: <T extends db.tbl.names>(
      table: T,
      value: db.data<T>,
      condition?: db.condition<T>,
    ) => {
      value = this.has_json(table)
        ? this.stringify_json<db.data<T>>(value)
        : value;

      const cond = this.fragment.condition(condition);
      return sql`UPDATE ${sql(table)} SET ${sql(value)} ${cond}`;
    },
    select: <T extends db.tbl.names>(
      table: T,
      condition?: db.condition<T>,
      sort?: db.sort<T>,
      ignore?: db.tbl.cols<T>[],
      max?: db.tbl.cols<T>,
    ): Promise<db.data<T>[]> => {
      const columns = this.fragment.columns(table, ignore);
      const cond = this.fragment.condition(condition);
      const sorter = this.fragment.sort(sort);
      return max
        ? sql`SELECT MAX(${sql(max)}) AS ${sql(max)} FROM ${sql(table)} ${cond}`
        : sql`SELECT ${columns} FROM ${sql(table)} ${cond} ${sorter}`.then(
            (r) => this.parse_json<T>(r, table),
          );
    },
    //select_json: <T extends db.tbl.names<"json">>(
    //  table: T,
    //  condition?: db.condition<T>,
    //  sort?: db.sort<T>,
    //  ignore?: db.tbl.cols<T>[],
    //) => {
    //  const columns = this.fragment_sql.columns(table, ignore);
    //  const cond = this.fragment_sql.condition_json(condition);
    //  const sorter = this.fragment_sql.sort(sort);
    //
    //  return sql<
    //    db.data<T>[]
    //  >`SELECT ${columns} FROM ${sql(table)} ${cond} ${sorter}`.then((r) =>
    //    this.parse_json<T>(r),
    //  );
    //},
    table_exists: (id: string, _sql = sql) =>
      _sql`SELECT name FROM sqlite_master WHERE type='table' AND name=${_sql(id)}`.then(
        (res) => (!!res[0] ? true : false),
      ),
    insert_chart: (table: string, values: chart_data_t[]) =>
      this.sql.table_exists(table, sql_c).then((exists) =>
        exists
          ? sql_c`INSERT INTO ${sql_c(table)} ${sql_c(values)} ON CONFLICT (${sql_c("time")}) DO NOTHING`
          : this.sql
              .create("charts_", sql_c)
              .then(() => this.sql.rename("charts_", table, sql_c))
              .then(() => sql_c`INSERT INTO ${sql_c(table)} ${sql_c(values)}`),
      ),
    select_chart: (id: string) =>
      this.sql
        .table_exists(id, sql_c)
        .then((exists) =>
          exists
            ? (sql_c`SELECT * FROM ${sql_c(id)} ORDER BY ${sql_c("time")} ASC` as Promise<
                chart_data_t[]
              >)
            : null,
        ),
  };

  private fragment = {
    sort: (sort?: db.sort<any>) => {
      if (!sort) return sql``;
      const [column, dir] = sort;
      return sql.unsafe(`ORDER BY ${column} ${dir}`);
    },
    condition: (condition?: db.condition<any>) => {
      if (!condition) return sql(``);
      const [col, value] = condition;
      if (typeof value !== "boolean")
        return sql`WHERE ${sql(col)} IN ${sql([value])}`;
      return value === true
        ? sql`WHERE ${sql(col)} IS NOT NULL`
        : sql`WHERE ${sql(col)} IS NULL`;
    },
    condition_json: <T extends db.tbl.names_json>(
      condition?: db.condition<T>,
    ) => {
      if (!condition) return sql(``);
      const [col, value] = condition;
      return sql`WHERE EXISTS (SELECT 1 FROM json_each(${sql(col)}) WHERE value=${sql(value)})`;
    },
    columns: <T extends db.tbl.names>(
      table: T,
      ignore: db.tbl.cols<T>[] = [],
    ) => {
      const columns = this.table_cols(table)
        .filter((col) => !ignore.includes(col[0] as db.tbl.cols<T>))
        .map((c) => c[0]!)
        .join(", ");
      return sql.unsafe(columns);
    },

    primary_conflict: (table: db.tbl.names) => {
      const primary_row = this.table_cols(table).find((col) =>
        (col[1] as string)?.includes("PRIMARY KEY"),
      );
      if (!primary_row) return sql``;
      return sql`ON CONFLICT (${sql(primary_row[0])}) DO NOTHING`;
    },
  };
  private snippets = {
    table_schema: (table: db.tbl.names) => {
      const cols = this.table_cols(table);
      return cols
        .map((col) => {
          return `'${col[0]}' ${col[1]}`;
        })
        .join(", ");
    },
  };

  private parse_json = <T extends db.tbl.names>(
    data: db.data<T>[],
    table: db.tbl.names,
  ) => {
    if (!this.has_json(table)) return data;

    return data.map((data) =>
      Object.entries(data).reduce((data, [key, value]) => {
        const k = key as keyof typeof data;
        if (!this.is_json_row(table, key)) return data;
        try {
          data[k] = JSON.parse(value as string);
          return data;
        } catch (_err) {
          return data;
        }
      }, data),
    );
  };
  private stringify_json = <T extends db.data<any> | db.data<any>[]>(
    data: T,
  ): T => {
    if (Array.isArray(data))
      return data.map((data) => this.stringify_json<db.data<any>>(data)) as T;

    return Object.entries(data).reduce((data, [key, value]) => {
      if (!Array.isArray(value)) return data;
      (data as any)[key] = JSON.stringify(value);
      return data;
    }, data);
  };
  private has_json = (table: db.tbl.names) => {
    return Tables.json_tables.includes(table);
  };
  private is_json_row = (table: db.tbl.names, row_name: string) => {
    const row = Tables.tables[table].find((row) => row[0] === row_name);
    return !!row && row[2] === "j";
  };
  private table_cols = <T extends db.tbl.names>(table: T): db.tbl.rows<T> => {
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

  //const instrmnt_view = Tables.views.instruments;
  //const location_view = Tables.views.location_search;
  //const live_data_view = Tables.views.live_data;
  await Promise.all(
    Object.values(Tables.views).map((view) => sql.unsafe(view).execute()),
    //    [
    //    sql.unsafe(instrmnt_view).execute(),
    //    sql.unsafe(location_view).execute(),
    //    sql.unsafe(live_data_view).execute(),
    //  ]
  );

  const table_names = Tables.table_names.filter((name) => {
    return !Tables.view_names.includes(name) && !name.endsWith("_");
  }) as db.tbl.names[];
  await Promise.all(table_names.map(table_schema));

  function table_schema(table_name: db.tbl.names) {
    const table_rows = Tables.tables[table_name]!;
    const schema = table_rows.map((col) => `'${col[0]}' ${col[1]}`).join(", ");
    return sql
      .unsafe(`CREATE TABLE IF NOT EXISTS ${table_name} (${schema})`)
      .execute();
  }
}
