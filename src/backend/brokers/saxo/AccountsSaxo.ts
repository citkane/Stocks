import { Global } from "backend";

export class AccountsSaxo extends Global {
  public update = async () => {
    const { get, fetch } = this.saxo.api;
    const req = get.accounts();
    const accounts = await fetch<b.s.data_t<b.s.account_t>>(req);
    logger.json("SAXO accounts raw", accounts.Data);
    return accounts.Data.map(this.translate.account);
  };
  public balances = async (accnts: g.account[]) => {
    const { get, fetch } = this.saxo.api;
    const { balance } = this.translate;
    return Promise.all(accnts.map(fetch_balance)).then(reduce_balances);

    function fetch_balance(acc: g.account) {
      const { broker_key } = acc;
      const req = get.balance(broker_key!);
      return fetch<b.s.balance_t>(req).then((bal) => balance(acc, bal));
    }
    function reduce_balances(bals: lv.balance[]) {
      return bals.reduce(
        (bals, b) => {
          const { a_id } = b;
          bals[a_id] = b;
          return bals;
        },
        {} as { [a_id: string]: lv.balance },
      );
    }
  };
  private translate = {
    account: (account: b.s.account_t): g.account => {
      const { AccountId, DisplayName, Currency, AccountKey } = account;
      return {
        a_id: `saxo_${AccountId}`,
        broker: "saxo",
        alias: DisplayName,
        currency: util.money.patch_currency(Currency),
        broker_key: AccountKey,
      };
    },
    balance: (account: g.account, balance: b.s.balance_t): lv.balance => {
      const { a_id } = account;
      let {
        Currency,
        UnrealizedPositionsValueExcludingCostToClosePositions: assets_val,
        CashBalance: cash,
      } = balance;
      return {
        a_id,
        currency: util.money.patch_currency(Currency),
        assets_val,
        cash,
      };
    },
  };
}
