import { expect, test, describe } from "bun:test";
import { util } from "../src/Util";


describe("Static", () => {
  describe("Date utils", () => {
    test("returns number", () => {
      expect(util.date()).toBeNumber();
    });
    test("returns days", () => {
      const now = util.date();
      const yesterday = new Date(now - 24 * 60 * 60 * 1000).toString();
      const days = util.aging_days(yesterday);
      expect(days).toEqual(1);
    });
  });
  describe("Text utils", () => {
    test("title case", () => {
      expect(util.Title_Case("title case")).toEqual("Title Case");
      console.error = () => {};
      // @ts-expect-error
      expect(util.Title_Case()).toEqual("");
    });
  });
});

