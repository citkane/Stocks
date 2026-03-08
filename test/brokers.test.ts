import { expect, test, describe } from "bun:test";
import { data } from "./mock/mocks";
import { Transactions } from "../src/backend/brokers";
import { Cache } from "../src/backend/Cache";

describe("Brokers", () => {
  const cache = new Cache();

  describe("data mapping", () => {
    test("ibkr transaction has keys", () => {
      data.ibkr.transactions.forEach((t, i) => {
        const transaction = new Transactions(t).map();
        type key_t = keyof typeof transaction;
        Object.keys(transaction).forEach((k) => {
          if (transaction.external_transfer && k === "price_buy") return;
          expect(transaction[k as key_t]).not.toBeUndefined();
        });
      });
    });
    test("ibkr transaction has last transfer account", () => {
      const transactions = data.ibkr.transactions[0]!;
      const transaction = new Transactions(transactions).map();
      expect(transaction.account_id).toEqual("U24238397");
    });
  });
  test("adds ibkr to cache", () => {
    data.ibkr.transactions.forEach(cache.add.transactions);
    cache.add.positions(data.ibkr.positions, "ibkr");
    cache.add.accounts(data.ibkr.accounts, "ibkr");

    expect(cache.ibkr_accounts?.length).toBeGreaterThan(0);
    expect(cache.ibkr_transactions?.length).toBeGreaterThan(0);
    expect(cache.ibkr_transactions?.length).toStrictEqual(
      cache.ibkr_positions?.length,
    );
  });
});
