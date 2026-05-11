import { default as _Logger, err_to_array } from "@common/Logger";

export default class Logger extends _Logger {
  static override debug(...p: any[]) {
    this.send("log_debug", p);
  }

  static override info(...p: any[]) {
    console.info(...p);
    this.send("log_info", p);
  }

  static override log(...p: any[]) {
    this.send("log_log", p);
  }

  static override error(...p: any[]): void;
  static override error(err: Error, cause?: string, ..._p: any[]) {
    const is_err = err instanceof Error;
    const e_array = is_err ? [err.message, cause || err.cause] : arguments;
    console.error(is_err ? err : _p);
    this.send("log_error", e_array);
  }

  static override warn(...p: any[]): void;
  static override warn(err: Error, cause?: string, ..._p: any[]) {
    const w_array = err instanceof Error ? err_to_array(err, cause) : arguments;
    console.warn(...w_array);
    this.send("log_warn", w_array);
  }

  private static get messenger() {
    return frontend.ws.messenger;
  }
  private static get send() {
    return this.messenger.send;
  }
}
