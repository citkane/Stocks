import { Global } from "backend";

export class AccountsIbkr extends Global {
  public update = async () => {
    const { get, fetch } = this.ibkr.api;
    const { url, req_init } = get.accounts();
    const accounts = await fetch<b.i.account_t[]>(url, req_init);
    logger.json("IBKR accounts raw", accounts);
    return accounts.map(this.translate.account);
  };
  public balances = async (accounts: g.account[]) => {
    const { get, fetch } = this.ibkr.api;
    const balances = await Promise.all(
      accounts.map((account) => {
        const { a_id } = account;
        const [_broker, id] = a_id.split("_");
        const { url, req_init } = get.balance(id!);
        return fetch<{
          [currency: string]: b.i.balance_t;
        }>(url, req_init).then((balances) => this.map_balances(balances));
      }),
    );
    return balances.flat();
  };
  private map_balances = (balances: { [currency: string]: b.i.balance_t }) => {
    delete balances.BASE;
    return Object.keys(balances).map((currency) => {
      const _balance = balances[currency]!;
      const balance = this.translate.balance(_balance);
      return balance;
    });
  };
  private translate = {
    account: (account: b.i.account_t): g.account => {
      const { accountId, accountAlias, currency } = account;
      return {
        a_id: `ibkr_${accountId}`,
        broker: "ibkr",
        alias: accountAlias,
        currency: util.money.patch_currency(currency),
      };
    },
    balance: (balance: b.i.balance_t): lv.balance => {
      let {
        acctcode,
        cashbalance: cash,
        currency,
        stockmarketvalue: assets_val,
      } = balance;
      const broker: g.broker = "ibkr";
      const a_id = `${broker}_${acctcode}` as id.a;

      return {
        a_id,
        currency,
        assets_val,
        cash,
      };
    },
  };
}
