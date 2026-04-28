export class Time {
  /**
   * Calculates the number of days passed since the given date
   * @param start_date
   * @returns
   */
  aging_days = (start_date: string | number) => {
    const date =
      typeof start_date === "number" ? start_date : this.ms(start_date);
    const now = this.ms_now();
    return Math.floor((now - date) / (24 * 60 * 60 * 1000));
  };
  /**
   * ms from epoch for the present moment
   * @returns
   */
  ms_now = () => this.ms("now");
  /**
   * Converts a date to ms from epoch
   * @param date
   */
  ms = (date: string | number) =>
    date === "now" ? new Date().valueOf() : new Date(date).valueOf();
  /**
   * Converts a date to seconds from epoch
   * @param date
   */
  sec = (date: string | number) => Math.floor(this.ms(date) / 1000);

  year = (date: string | number = this.ms_now()) =>
    new Date(date).getFullYear();

  period = {
    /**
     * Returns ms from the epoch rounded up to the given granularity
     * @param date_time
     * @param period
     * @returns ms from epoch minus 1ms to ensure period end.
     */
    ms_end: (date_time: string | number, period: period_t): number => {
      const day_ms = this.period.to_ms([1, "d"]);
      const period_ms = this.period.to_ms(period);

      // end of last day in given period
      if (period_ms > day_ms) {
        const days_ms = Math.floor(period_ms / day_ms) * day_ms;
        const day_end = this.period.ms_end(date_time, [1, "d"]);
        return day_end + days_ms;
      }
      // end of day
      if (period_ms === day_ms) {
        const date_time_string =
          typeof date_time === "number"
            ? this.epoch.to_iso(date_time)
            : date_time;
        const [date, _time] = date_time_string.split("T");
        return this.ms(`${date}T23:59:59.999999Z`);
      }
      // end of given period
      date_time =
        typeof date_time === "number" ? date_time : this.ms(date_time);
      const periods = Math.ceil(date_time / period_ms);

      return period_ms * periods - 1;
    },

    /**
     * Converts a time period to minutes.
     * @param period :period_t eg. `[1, "d"]`
     * @returns
     */
    to_min: (period: period_t) => {
      const ms = this.period.to_ms(period);
      return Math.floor(ms / 1000 / 60);
    },
    /**
     * Converts a time period to milliseconds.
     * @param period :period_t eg. `[1, "d"]`
     * @returns
     */
    to_ms: (period: period_t) => {
      return period_to_ms[period[1]](period[0]);
    },
    /**
     * Converts a time period to a string, eg. `[1,"h"]` to "1h"
     * @param period
     * @returns
     */
    to_string: (period: period_t) => {
      return `${period[0]}${period[1]}`;
    },
  };
  epoch = {
    /**
     * Calculates ms from epoch for the given period ago
     * @param period
     * @param seconds Flag if return should be in seconds
     */
    ago: (period: period_t) => {
      const ms_ago = period_to_ms[period[1]](period[0]);
      return this.ms_now() - ms_ago;
    },
    /**
     * Converts epoch to ISO time string "yyyy-mm-ddThh:mm:ss.msZ"
     * @param ms
     * @returns
     */
    to_iso: (ms: number) => {
      return new Date(ms).toISOString();
    },
    /**
     * Converts epoch to ISO date string "yyyy-mm-dd"
     * @param ms
     * @returns
     */
    to_iso_date: (ms: number = new Date().valueOf()) => {
      return this.epoch.to_iso(ms).split("T")[0]!;
    },
    /**
     * Convert epoch to a UTC time string "Day, dd mm yyyy hh:mm:ss TZONE"
     * @param date_time
     * @returns
     */
    to_utc: (date_time: number | string) => {
      const date = new Date(date_time);
      return date.toUTCString();
    },
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

type time_t = keyof typeof period_to_ms;
declare global {
  type period_t = [number, time_t];
}
