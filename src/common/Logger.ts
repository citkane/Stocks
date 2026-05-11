export default class Logger {
  static debug(..._p: any[]) {}
  static info(..._p: any[]) {}
  static log(..._p: any[]) {}

  static error(...p: any[]): void;
  static error(_err: Error, _cause?: string, ..._p: any[]) {}

  static warn(...p: any[]): void;
  static warn(_err: Error, _cause?: string, ..._p: any[]) {}

  static async json<T>(_name: string, data: T) {
    return data;
  }
  static shutdown() {}
}

export var fe_ident = "[fe]";
export function err_to_array(err: Error, cause?: string) {
  if (typeof err === "object" && !Array.isArray(err)) {
    const err_ob = Object.keys(err).reduce(
      (c, key) => {
        c[key] = err[key as keyof Error];
        return c;
      },
      {} as { [key: string]: any },
    );
    if (!!cause) err_ob.cause = cause;
    return [to_json(err_ob)];
  }
  if (Array.isArray(err)) {
    return [...err, cause];
  }
  return [err, cause];
}

export function to_string(...p: any[]) {
  p = p.map((m) => {
    if (typeof m === "object" || typeof m === "function") return to_json(m);
    return m;
  });
  return p.join(" ");
}
function to_json(j: Object | Function) {
  return JSON.stringify(j, null, 2);
}

export type level_t = "ERR" | "WARN" | "LOG" | "INFO" | "DEBUG";
