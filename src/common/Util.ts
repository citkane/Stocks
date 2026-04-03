import { exchanges } from ".";

type time_t = keyof typeof period_to_ms;
declare global {
  type period_t = [number, time_t];
}
const money_round = 100;
const fx_round = 1000000;

export class Util {
  static get url() {
    return {
      saxo: {
        api: `${conf.saxo.url.base}/${conf.saxo.url.endpoints.api}`,
        auth: `${conf.saxo.url.auth}`,
        chart: `${conf.saxo.url.base}/${conf.saxo.url.endpoints.chart}`,
        history: `${conf.saxo.url.base}/${conf.saxo.url.endpoints.history}`,
        ref: `${conf.saxo.url.base}/${conf.saxo.url.endpoints.ref}`,
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
    money: (value: number) => {
      if (value === 0) return "0.00";
      let [whole, fraction] = (value / 100).toString().split(".");
      fraction = (fraction || "").padEnd(2, "0");
      return `${whole || "0"}.${fraction}`;
    },
    html_escape: (str: string) => {
      return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    },
    html_json: (data: Object) => {
      return this.string.html_escape(JSON.stringify(data));
    },
  };
  static time = {
    /**
     * Calculates the number of days passed since the given date
     * @param start_date
     * @returns
     */
    aging_days: (start_date: string | number) => {
      const date =
        typeof start_date === "number" ? start_date : this.time.ms(start_date);
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
  static money = {
    /**
     * Calculates total Profit/Loss
     * @param transaction
     * @returns Total P/L in base currency whole number
     */
    pl_base_whole: (transaction: transaction_t) => {
      let { amount, price_traded, price_market, fx_traded, fx_market } =
        transaction;
      if (!amount || !price_traded || !fx_market || !price_market || !fx_traded)
        return 0;

      price_market = this.money.whole_money(price_market);
      price_traded = this.money.whole_money(price_traded);
      const price_diff = price_market - price_traded;

      return this.money.base_money_whole(amount, price_diff / 100, fx_market);
    },
    /**
     * Calculates fx Profit/Loss
     * @param transaction
     * @returns Fx P/L in base currency whole number
     */
    fx_pl_base_whole: (transaction: transaction_t) => {
      const { amount, price_traded, price_market, fx_traded, fx_market } =
        transaction;
      if (!amount || !price_traded || !fx_market || !price_market || !fx_traded)
        return 0;

      const traded_base_value = this.money.base_money_whole(
        amount,
        price_traded,
        fx_traded,
      );
      const market_base_value = this.money.base_money_whole(
        amount,
        price_traded,
        fx_market,
      );

      return market_base_value - traded_base_value;
    },
    /**
     * Convert money by exchange rate
     * @param amount
     * @param price
     * @param fx_rate
     * @returns Money value in whole number
     */
    base_money_whole: (amount?: number, price?: number, fx_rate?: number) => {
      if (!amount || !price || !fx_rate) return 0;
      price = this.money.whole_money(price);
      fx_rate = this.money.round_fx(fx_rate);
      return Math.round(amount * price * fx_rate);
    },
    /**
     * Money value in whole number
     * @param value
     * @returns
     */
    whole_money: (value: number) => {
      return Math.round(value * money_round);
    },
    round_fx: (rate: number) => {
      return Math.round(rate * fx_round) / fx_round;
    },
    aggregate_position: (position: position_t) => {
      let { buys, sells } = structuredClone(position);
      if (!sells.length) return [...buys];

      const tctns = [...buys, ...sells].sort((a, b) => a.date - b.date);
      let sold = 0;

      return tctns.reduce((c, transaction) => {
        const { kind, amount } = transaction;

        if (kind === "sell") {
          sold += Math.abs(amount);
          const match = tctns.find((t) => t.kind === "buy" && t.amount > 0)!;
          const bought = match.amount;
          if (bought >= sold) {
            match.amount -= sold;
            sold = 0;
          } else {
            match.amount = 0;
            sold -= bought;
          }
        } else {
          c.push(transaction);
        }

        return c;
      }, [] as transaction_t[]);
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
