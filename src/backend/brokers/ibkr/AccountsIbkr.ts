import { Global } from "backend";

export class AccountsIbkr extends Global {
  public update = async () => {
    const { get, fetch } = this.ibkr.api;
    const { url, req_init } = get.accounts();
    const accounts = await fetch<b.i.account_t[]>(url, req_init);
    logger.json("IBKR accounts raw", accounts);
    return accounts.map(this.translate.account);
  };
  public balances = async (accounts: account_t[]) => {
    const { get, fetch } = this.ibkr.api;
    const balances = await Promise.all(
      accounts.map((account) => {
        const { a_id_original, alias } = account;
        const { url, req_init } = get.balance(a_id_original);
        return fetch<{
          [currency: string]: b.i.balance_t;
        }>(url, req_init).then((balances) =>
          this.map_balances(balances, alias),
        );
      }),
    );
    return balances.flat();
  };
  private map_balances = (
    balances: {
      [currency: string]: b.i.balance_t;
    },
    alias?: string,
  ) => {
    delete balances.BASE;
    return Object.keys(balances).map((currency) => {
      const _balance = balances[currency]!;
      const balance = this.translate.balance(_balance);
      balance.alias = alias;
      return balance;
    });
  };
  private translate = {
    account: (account: b.i.account_t): account_t => {
      const { accountId, accountAlias, currency } = account;
      return {
        a_id: `ibkr_${accountId}`,
        a_id_original: accountId,
        broker: "ibkr",
        alias: accountAlias,
        currency,
      };
    },
    balance: (balance: b.i.balance_t): balance_t => {
      let {
        acctcode,
        cashbalance: cash,
        currency,
        stockmarketvalue: assets_val,
      } = balance;
      const broker: broker_t = "ibkr";
      const a_id = `${broker}_${acctcode}`;
      const a_id_original = acctcode;

      return {
        a_id,
        a_id_original,
        broker,
        currency,
        assets_val,
        cash,
      };
    },
  };
}
