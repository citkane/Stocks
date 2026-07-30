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
    //console.log({ json_tables: Tables.json_tables, tables: Tables.tables });
  }
  protected sql = {
    drop: (table: db.tbl.names) => {
      return sql`DROP TABLE IF EXISTS ${sql(table)};`;
    },
    delete: <T extends db.tbl.names>(
      table: T,
      col: db.tbl.col_names<T>,
      rows: string[],
    ) => {
      return sql`DELETE FROM ${sql(table)} WHERE ${sql(col)} IN (${sql(rows.join(", "))})`;
    },
    insert: async <T extends db.tbl.names>(
      table: T,
      values?: db.data<T>[],
      update = false,
    ) => {
      if (!values || !values.length) return;

      values = this.parse_data.in(values, table);
      const cols = Object.keys(values[0]!) as db.tbl.col_names<T>[];
      const conflict = this.fragment.primary_conflict(table, cols, update);
      return sql`INSERT INTO ${sql(table)} ${sql(values)} ${conflict}`;
    },
    select: <T extends db.tbl.names, C extends db.tbl.col_names<T>>(
      table: T,
      condition?: db.condition<T>,
      sort?: db.sort<T>,
      cols?: C[],
      max?: C,
    ) => {
      const columns = this.fragment.columns(cols),
        cond = this.fragment.condition(table, condition),
        sorter = this.fragment.sort(sort),
        parser = this.parse_data.out<T, C & string>;

      return max
        ? sql`SELECT MAX(${sql(max)}) AS ${sql(max)} FROM ${sql(table)} ${cond}`.then(
            (r) => parser(r, table),
          )
        : sql`SELECT ${columns} FROM ${sql(table)} ${cond} ${sorter}`.then(
            (r) => parser(r, table),
          );
    },
    table_exists: (id: string, _sql = sql) =>
      _sql`SELECT name FROM sqlite_master WHERE type='table' AND name=${_sql(id)}`.then(
        (res) => (!!res[0] ? true : false),
      ),
    chart: {
      create: async (name: string) => {
        const { chart } = this.sql;
        return create_table("live_chart", sql_c).then(() => chart.rename(name));
      },
      rename: (name: string) => {
        return sql_c`ALTER TABLE ${sql_c("live_chart")} RENAME TO ${sql_c(name)}`;
      },
      insert: async (name: string, values: db.data<"live_chart">[]) => {
        const { table_exists, chart } = this.sql;
        if (!(await table_exists(name, sql_c))) await chart.create(name);
        return sql_c`INSERT INTO ${sql_c(name)} ${sql_c(values)} ON CONFLICT (${sql_c("time")}) DO NOTHING`;
      },
      select: async (id: string) => {
        const exists = await this.sql.table_exists(id, sql_c);
        if (!exists) {
          logger.warn(`No such chart data: ${id}`);
          return [];
        }

        return sql_c`SELECT * FROM ${sql_c(id)} ORDER BY ${sql_c("time")} ASC`;
      },
    },
  };

  private fragment = {
    sort: (sort?: db.sort<any>) => {
      if (!sort) return sql``;
      const [column, dir] = sort;
      return sql.unsafe(`ORDER BY ${column} ${dir}`);
    },
    condition: <T extends db.tbl.names>(
      table: T,
      condition?: db.condition<any>,
    ) => {
      if (!condition) return sql(``);
      const [col, value] = condition;
      if (typeof value !== "boolean" && this.is_json(table).col(col))
        return this.fragment.condition_json(condition);

      if (typeof value !== "boolean")
        return sql`WHERE ${sql(col)} IN ${sql([value])}`;
      return value === true
        ? sql`WHERE ${sql(col)} IS NOT NULL`
        : sql`WHERE ${sql(col)} IS NULL`;
    },
    condition_json: (condition?: db.condition<any>) => {
      if (!condition) return sql(``);
      const [col, value] = condition;
      return sql`WHERE EXISTS (SELECT 1 FROM json_each(${sql.unsafe(col)}) WHERE value=${sql(value)})`;
    },
    columns: <T extends db.tbl.names>(
      cols?: readonly db.tbl.col_names<T>[],
    ) => {
      const columns = cols && cols.length ? cols.join(", ") : "*";
      return sql.unsafe(columns);
    },
    primary_conflict: <T extends db.tbl.names>(
      table: T,
      cols: db.tbl.col_names<T>[],
      update: boolean,
    ) => {
      const { fragment } = this;
      const primary_key = Tables.primary_cols[table];
      if (!primary_key) return sql``;
      if (!update) return sql`ON CONFLICT (${sql(primary_key)}) DO NOTHING`;

      return sql`ON CONFLICT (${sql(primary_key)}) DO UPDATE ${fragment.update(table, cols)}`;
    },
    update: <T extends db.tbl.names>(table: T, cols: db.tbl.col_names<T>[]) => {
      const { fragment } = this;
      const update_statement = cols
        .map((col) => {
          const is_json = this.is_json(table).col(col);
          return is_json
            ? fragment.replace_json(col)
            : `${col} = excluded.${col}`;
        })
        .join(", ");

      return sql.unsafe(`SET ${update_statement}`);
    },
    replace_json: (col: string) => {
      return `${col} = json_replace(${col}, '$', json(excluded.${col}))`;
    },
  };

  private parse_data = {
    out: <T extends db.tbl.names, C extends db.tbl.col_names<T>>(
      data: db.data<T>[],
      table: db.tbl.names,
    ) => {
      const is_json = this.is_json(table);
      return !is_json.table
        ? (data as unknown as db.res_type<T, C>[])
        : (data.map((row) => {
            return Object.entries(row).reduce((data, [key, value]) => {
              const k = key as db.tbl.col_names<T>;
              if (!is_json.col(k)) return data;
              (data as any)[k] = JSON.parse(value as string);
              return data;
            }, row);
          }) as unknown as db.res_type<T, C>[]);
    },
    in: <T extends db.tbl.names>(data: db.data<T>[], table: db.tbl.names) => {
      const is_json = this.is_json(table);
      return !is_json.table
        ? data
        : data.map((row) => {
            return Object.entries(row).reduce((data, [key, value]) => {
              const k = key as db.tbl.col_names<T>;
              if (!is_json.col(k)) return data;
              (data as any)[k] = JSON.stringify(value);
              return data;
            }, row);
          });
    },
  };

  private is_json = <T extends db.tbl.names>(table_name: T) => {
    return {
      table: !!Tables.json_tables[table_name],
      col,
    };
    function col<C extends db.tbl.col_names<T>>(col: C) {
      return (
        Tables.json_tables[table_name] &&
        Tables.json_tables[table_name][col] === true
      );
    }
  };
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

  const table_names = Tables.table_names.filter((name) => {
    return !Tables.view_names.includes(name) && name !== "live_chart";
  }) as db.tbl.names[];
  await Promise.all(table_names.map((table) => create_table(table)));
  await Promise.all(
    Object.values(Tables.views).map((view) => sql.unsafe(view).execute()),
  );
}

function create_table(table_name: db.tbl.names, _sql = sql) {
  const schema = Tables.schema(table_name);
  return _sql
    .unsafe(`CREATE TABLE IF NOT EXISTS ${table_name} (${schema})`)
    .execute();
}
