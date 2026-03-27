import { expect, test, describe } from "bun:test";
import { Util as util } from "../src/common";

describe("static", () => {
  describe("date", () => {
    test("returns number", () => {
      expect(util.time.ms_now()).toBeNumber();
    });
    test("returns days", () => {
      const now = util.time.ms_now();
      const yesterday = new Date(now - 24 * 60 * 60 * 1000).toString();
      const days = util.time.aging_days(yesterday);
      expect(days).toEqual(1);
    });
    test("period ending", () => {
      const date_time = "2026-03-25T14:30:57.053Z";
      const periods = {
        hour: util.time.ms_period_end(date_time, [1, "h"]),
        day: util.time.ms_period_end(date_time, [1, "d"]),
        week: util.time.ms_period_end(date_time, [7, "d"]),
        month: util.time.ms_period_end(date_time, [1, "m"]),
      };
      const check = Object.keys(periods).reduce(
        (c, period) => {
          c[period] = util.string.epoch_to_utc(
            periods[period as keyof typeof periods],
          );
          return c;
        },
        {} as { [key: string]: string },
      );
      expect(check).toEqual({
        hour: "Wed, 25 Mar 2026 14:59:59 GMT",
        day: "Wed, 25 Mar 2026 23:59:59 GMT",
        week: "Wed, 01 Apr 2026 23:59:59 GMT",
        month: "Fri, 24 Apr 2026 23:59:59 GMT",
      });
    });
  });
  describe("text", () => {
    test("title case", () => {
      expect(util.string.title_case("title case")).toEqual("Title Case");
    });
  });
});
