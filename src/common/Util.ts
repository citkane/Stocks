import { exchanges } from ".";

type time_t = keyof typeof to_minutes;
declare global {
  type period_t = [number, time_t];
}

export class Util {
  static string = {
    title_case: (str: string) =>
      str
        ? str
            .toLowerCase()
            .split(" ")
            .map(function (word) {
              return word.charAt(0).toUpperCase() + word.slice(1);
            })
            .join(" ")
        : "",
    /**
     * Converts a time period to a string, eg. `[1,"h"]` to "1h"
     * @param period
     * @returns
     */
    period: (period: period_t) => {
      return `${period[0]}${period[1]}`;
    },
    /**
     * Converts epoch to ISO time string "yyyy-mm-ddThh:mm:ss.msZ"
     * @param ms
     * @returns
     */
    epoch_to_iso: (ms: number) => {
      return new Date(ms).toISOString();
      //const date = new Date(time);
      //const year = date.getFullYear();
      //const month = (date.getMonth() + 1).toString().padStart(2, "0");
      //const day = date.getDate().toString().padStart(2, "0");
      //return `${year}-${month}-${day}`;
    },
    /**
     * Converts epoch to ISO date string "yyyy-mm-dd"
     * @param ms
     * @returns
     */
    epoch_to_iso_date: (ms: number) => {
      return this.string.epoch_to_iso(ms).split("T")[0]!;
    },

    /**
     * Convert epoch to a UTC time string "Day, dd mm yyyy hh:mm:ss TZONE"
     * @param ms
     * @returns
     */
    epoch_to_utc: (ms: number) => {
      const date = new Date(ms);
      return date.toUTCString();
    },
    format_ticker: (
      _exchange: exchanges_t,
      ticker: string,
      description: string,
    ) => {
      const exchange = exchanges[_exchange] || _exchange;
      if (!!ticker && exchange === "hkse") ticker = pad_hkse_ticker(ticker!);
      description = this.string.title_case(description);
      return { exchange, ticker, description };
    },
  };
  static time = {
    /**
     * Calculates the number of days passed since the given date
     * @param start_date
     * @returns
     */
    aging_days: (start_date: string) => {
      const date = this.time.ms(start_date);
      const now = this.time.ms_now();
      return Math.floor((now - date) / (24 * 60 * 60 * 1000));
    },
    /**
     * ms from epoch for the present moment
     * @param seconds Flag if return should be in seconds
     * @returns
     */
    ms_now: <T = number>(seconds = false) => this.time.ms<T>("now", seconds),
    /**
     * Converts a date to ms from epoch
     * @param date
     * @param seconds Flag if return should be in seconds
     */
    ms: <T = number>(date: string | number, seconds = false) => {
      const epoch =
        date === "now" ? new Date().valueOf() : new Date(date).valueOf(); //getUTCMilliseconds();
      return seconds ? (Math.floor(epoch / 1000) as T)! : (epoch as T)!;
    },
    ms_day_end: (time: string | number, seconds = false) => {
      if (typeof time === "number") time = this.string.epoch_to_iso(time);
      const [date, _time] = time.split("T");
      return this.time.ms(`${date}T23:59:59.999999Z`, seconds);
    },
    /**
     * Calculates ms from epoch for the given period ago
     * @param period
     * @param seconds Flag if return should be in seconds
     */
    epoch_ago: <T = number>(period: period_t, seconds = false) => {
      const ms_ago = to_minutes[period[1]](period[0]) * 60 * 1000;
      const epoch = this.time.ms_now() - ms_ago;
      return seconds ? (Math.floor(epoch / 1000) as T)! : (epoch as T)!;
    },
    /**
     * Converts a time period to minutes.
     * @param period :period_t eg. `[1, "d"]`
     * @returns
     */
    period_to_min: (period: period_t) => {
      return to_minutes[period[1]](period[0]);
    },
    /**
     * Converts a time period to milliseconds.
     * @param period :period_t eg. `[1, "d"]`
     * @returns
     */
    period_to_ms: (period: period_t) => {
      return to_minutes[period[1]](period[0]) * 60 * 1000;
    },
  };
  static resolver = {
    empty: (): resolver_t => {
      return { resolve: () => {}, reject: () => {} };
    },
  };
  static colours = {
    red: "#ef5350",
    green: "#26a69a",
    blue: "#3179F5",
  };
}

const to_minutes = {
  min: (count: number) => count,
  h: (count: number) => count * 60,
  d: (count: number) => count * to_minutes.h(24),
  m: (count: number) => count * to_minutes.d(30),
  y: (count: number) => count * to_minutes.d(364),
};
function pad_hkse_ticker(ticker: string) {
  return ticker.length < 4 ? ticker!.padStart(4, "0") : ticker;
}
