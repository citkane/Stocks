import { exchanges } from ".";

type time_t = keyof typeof period_to_ms;
declare global {
  type period_t = [number, time_t];
}

export class Util {
  static get url() {
    return {
      saxo: {
        api: `${conf.saxo.url.base}/${conf.saxo.url.endpoints.api}`,
        auth: `${conf.saxo.url.auth}`,
        chart: `${conf.saxo.url.base}/${conf.saxo.url.endpoints.chart}`,
        history: `${conf.saxo.url.base}/${conf.saxo.url.endpoints.history}`,
        redirect: {
          code: `${conf.saxo.url.redirect.code}`,
          token: `${conf.saxo.url.redirect.token}`,
        },
      },
      ibkr: {
        api: `${conf.ibkr.url.base}/${conf.ibkr.url.endpoints.api}`,
        login: `${conf.ibkr.url.base}`,
      },
    };
  }
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
    epoch_to_iso_date: (ms: number = this.time.ms_now()) => {
      return this.string.epoch_to_iso(ms).split("T")[0]!;
    },

    /**
     * Convert epoch to a UTC time string "Day, dd mm yyyy hh:mm:ss TZONE"
     * @param date_time
     * @returns
     */
    epoch_to_utc: (date_time: number | string) => {
      const date = new Date(date_time);
      return date.toUTCString();
    },
    format_ticker: (
      _exchange: exchanges_t,
      ticker: string,
      description: string,
    ) => {
      const exchange = exchanges[_exchange] || _exchange;
      ticker = ticker.split(":")[0]!;
      if (exchange === "hkse") ticker = pad_hkse_ticker(ticker!);
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
    ms_now: () => this.time.ms("now"),
    /**
     * Converts a date to ms from epoch
     * @param date
     */
    ms: (date: string | number) =>
      date === "now" ? new Date().valueOf() : new Date(date).valueOf(),
    /**
     * Converts a date to seconds from epoch
     * @param date
     */
    sec: (date: string | number) => Math.floor(this.time.ms(date) / 1000),
    /**
     * Returns ms from the epoch rounded up to the given granularity
     * @param date_time
     * @param period
     * @returns ms from epoch minus 1ms to ensure period end.
     */
    ms_period_end: (date_time: string | number, period: period_t): number => {
      const day_ms = this.time.period_to_ms([1, "d"]);
      const period_ms = this.time.period_to_ms(period);

      // end of last day in given period
      if (period_ms > day_ms) {
        const days_ms = Math.floor(period_ms / day_ms) * day_ms;
        const day_end = this.time.ms_period_end(date_time, [1, "d"]);
        return day_end + days_ms;
      }
      // end of day
      if (period_ms === day_ms) {
        const date_time_string =
          typeof date_time === "number"
            ? this.string.epoch_to_iso(date_time)
            : date_time;
        const [date, _time] = date_time_string.split("T");
        return this.time.ms(`${date}T23:59:59.999999Z`);
      }
      // end of given period
      date_time =
        typeof date_time === "number" ? date_time : this.time.ms(date_time);
      const periods = Math.ceil(date_time / period_ms);

      return period_ms * periods - 1;
    },
    /**
     * Calculates ms from epoch for the given period ago
     * @param period
     * @param seconds Flag if return should be in seconds
     */
    epoch_ago: (period: period_t) => {
      const ms_ago = period_to_ms[period[1]](period[0]);
      return this.time.ms_now() - ms_ago;
    },
    /**
     * Converts a time period to minutes.
     * @param period :period_t eg. `[1, "d"]`
     * @returns
     */
    period_to_min: (period: period_t) => {
      const ms = this.time.period_to_ms(period);
      return Math.floor(ms / 1000 / 60);
    },
    /**
     * Converts a time period to milliseconds.
     * @param period :period_t eg. `[1, "d"]`
     * @returns
     */
    period_to_ms: (period: period_t) => {
      return period_to_ms[period[1]](period[0]);
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

const period_to_ms = {
  s: (count: number) => count * 1000,
  min: (count: number) => count * period_to_ms.s(60),
  h: (count: number) => count * period_to_ms.min(60),
  d: (count: number) => count * period_to_ms.h(24),
  w: (count: number) => count * period_to_ms.d(7),
  m: (count: number) => count * period_to_ms.d(30.4375),
  y: (count: number) => count * period_to_ms.d(365.25),
};
function pad_hkse_ticker(ticker: string) {
  return ticker.length < 4 ? ticker!.padStart(4, "0") : ticker;
}
