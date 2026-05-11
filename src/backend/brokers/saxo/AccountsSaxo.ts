import { Global } from "backend";

export class AccountsSaxo extends Global {
  public update = async () => {
    const query = this.saxo.endpoints.get.accounts();
    const accounts = await this.saxo.fetch<b.s.data_t<b.s.account_t>>(query);
    logger.json("SAXO accounts raw", accounts.Data);
    return accounts.Data.map(this.translate.account);
  };
  public balances = (accounts: account_t[]) => {
    return Promise.all(
      accounts.map((account) => {
        const { saxo_key } = account;
        const query = this.saxo.endpoints.get.balance(saxo_key!);
        return this.saxo
          .fetch<b.s.balance_t>(query)
          .then((bal) => this.translate.balance(account, bal));
      }),
    );
  };
  private translate = {
    account: (account: b.s.account_t): account_t => {
      const { AccountId, DisplayName, Currency, AccountKey } = account;
      return {
        a_id: `saxo_${AccountId}`,
        a_id_original: AccountId,
        broker: "saxo",
        alias: DisplayName,
        currency: Currency,
        saxo_key: AccountKey,
      };
    },
    balance: (account: account_t, balance: b.s.balance_t): balance_t => {
      const { a_id, alias } = account;
      let {
        Currency: currency,
        UnrealizedPositionsValueExcludingCostToClosePositions: assets_val,
        CashBalance: cash,
      } = balance;
      const [broker, a_id_original] = a_id.split("_") as [broker_t, string];
      return {
        a_id,
        a_id_original,
        alias,
        broker,
        currency,
        assets_val,
        cash,
      };
    },
  };
}
