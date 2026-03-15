import { expect, test, describe } from "bun:test";
import { util } from "../src/common";

describe("Static", () => {
  describe("Date utils", () => {
    test("returns number", () => {
      expect(util.time.to_epoch()).toBeNumber();
    });
    test("returns days", () => {
      const now = util.time.to_epoch();
      const yesterday = new Date(now - 24 * 60 * 60 * 1000).toString();
      const days = util.time.aging_days(yesterday);
      expect(days).toEqual(1);
    });
  });
  describe("Text utils", () => {
    test("title case", () => {
      expect(util.string.title_case("title case")).toEqual("Title Case");
      console.error = () => {};
      // @ts-expect-error
      expect(util.string.title_case()).toEqual("");
    });
  });
});
