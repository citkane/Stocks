import {
  default as _Logger,
  fe_ident,
  to_string,
  err_to_array,
  type level_t,
} from "@common/Logger";

var log_dir = ".logs";
var err_writer = await file_writer("error");
var log_writer = await file_writer("info");
var debug_writer = await file_writer("debug");
var fe = {
  err_writer: await file_writer("error.frontend"),
  log_writer: await file_writer("info.frontend"),
  debug_writer: await file_writer("debug.frontend"),
};

export default class Logger extends _Logger {
  static override debug(...p: any[]) {
    const _is_fe = is_fe(p);
    const d_line = to_string(...p);
    const writer = _is_fe ? fe.debug_writer : debug_writer;

    write(writer, d_line, "DEBUG");
  }

  static override info(...p: any[]) {
    const _is_fe = is_fe(p);
    if (!_is_fe) console.info(...p);
    const l_line = to_string(...p);
    const writers = _is_fe
      ? [fe.log_writer, fe.err_writer, fe.debug_writer]
      : [log_writer, err_writer, debug_writer];

    writers.forEach((writer) => write(writer, l_line, "INFO"));
  }

  static override log(...p: any[]) {
    const _is_fe = is_fe(p);
    const l_line = to_string(...p);
    const writers = _is_fe
      ? [fe.log_writer, fe.err_writer, fe.debug_writer]
      : [log_writer, err_writer, debug_writer];

    writers.forEach((writer) => write(writer, l_line, "LOG"));
  }

  static override error(...p: any[]): void;
  static override error(err: Error, cause?: string, ..._p: any[]) {
    const is_err = err instanceof Error;
    const args = is_err ? err_to_array(err, cause) : [...arguments];
    const _is_fe = is_fe(args);
    const e_line = to_string(...args);
    if (!is_fe) console.error(...args);

    const writers = _is_fe
      ? [fe.err_writer, fe.debug_writer]
      : [err_writer, debug_writer];

    writers.forEach((writer) => write(writer, e_line, "ERR"));
  }

  static override warn(...p: any[]): void;
  static override warn(err: Error, cause?: string, ..._p: any[]) {
    const is_err = err instanceof Error;
    const args = is_err ? err_to_array(err, cause) : [...arguments];
    const _is_fe = is_fe(args);

    const e_line = to_string(...args);
    if (!_is_fe) console.warn(...args);

    const writers = _is_fe
      ? [fe.err_writer, fe.debug_writer]
      : [err_writer, debug_writer];

    writers.forEach((writer) => write(writer, e_line, "WARN"));
  }

  static override async json<T>(name: string, data: T) {
    const json = JSON.stringify(data, map_to_obj, 2);
    name = name.replaceAll(" ", "_");
    const file_path = `${log_dir}/data/${name}.json`;
    let file = Bun.file(file_path);

    if (await file.exists()) {
      const file_copy = `${log_dir}/rotate/data/${name}.${timestamp()}.json`;
      const _file_copy = Bun.file(file_copy);
      await _file_copy.write(file);
      //await file.delete();
      file = Bun.file(file_path);
    }
    await file.write(json);
    return data;
  }

  static override shutdown() {
    [
      err_writer,
      log_writer,
      debug_writer,
      fe.err_writer,
      fe.log_writer,
      fe.debug_writer,
    ].forEach((file) => {
      file.writer.flush();
      file.writer.unref();
    });
  }
}

async function file_writer(file: string) {
  const file_path = `${log_dir}/${file}.log`;
  let _file = Bun.file(file_path);

  if (await _file.exists()) {
    const file_copy = `${log_dir}/rotate/${file}.${timestamp()}.log`;
    const _file_copy = Bun.file(file_copy);
    await _file_copy.write(_file);
    await _file.delete();
    _file = Bun.file(file_path);
  }

  const writer = _file.writer();
  writer.ref();
  return { writer, name: _file.name! };
}
function timestamp() {
  return new Date().toISOString();
}
function write(
  file: { writer: Bun.FileSink; name: string },
  message: string,
  level: level_t,
) {
  const _level = `[ ${level.padEnd(5, " ")} ]`;
  file.writer.write(`${timestamp()} ${_level} ${message}\n`);
}

function is_fe(p: any[]) {
  const is_fe = p[0] === fe_ident;
  if (is_fe) p.shift();
  return is_fe;
}
function map_to_obj(_key: any, value: any) {
  return value instanceof Map ? Object.fromEntries(value) : value;
}
