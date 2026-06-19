import { Global } from "backend";

export class AccountsSaxo extends Global {
  public update = async () => {
    const { get, fetch } = this.saxo.api;
    const req = get.accounts();
    const accounts = await fetch<b.s.data_t<b.s.account_t>>(req);
    logger.json("SAXO accounts raw", accounts.Data);
    return accounts.Data.map(this.translate.account);
  };
  public balances = async (accnts: account_t[]) => {
    const { get, fetch } = this.saxo.api;
    const { balance } = this.translate;
    return Promise.all(accnts.map(fetch_balance)).then(reduce_balances);

    function fetch_balance(acc: account_t) {
      const { broker_key } = acc;
      const req = get.balance(broker_key!);
      return fetch<b.s.balance_t>(req).then((bal) => balance(acc, bal));
    }
    function reduce_balances(bals: balance_t[]) {
      return bals.reduce(
        (bals, b) => {
          const { a_id } = b;
          bals[a_id] = b;
          return bals;
        },
        {} as { [a_id: string]: balance_t },
      );
    }
  };
  private translate = {
    account: (account: b.s.account_t): account_t => {
      const { AccountId, DisplayName, Currency, AccountKey } = account;
      return {
        a_id: `saxo_${AccountId}`,
        //a_id_original: AccountId,
        broker: "saxo",
        alias: DisplayName,
        currency: Currency,
        broker_key: AccountKey,
      };
    },
    balance: (account: account_t, balance: b.s.balance_t): balance_t => {
      const { a_id } = account;
      let {
        Currency: currency,
        UnrealizedPositionsValueExcludingCostToClosePositions: assets_val,
        CashBalance: cash,
      } = balance;
      return {
        a_id,
        currency,
        assets_val,
        cash,
      };
    },
  };
}
