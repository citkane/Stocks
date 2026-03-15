import { Global } from "backend";

export class Account extends Global {
  constructor(
    private account: saxo_t.account_t | ibkr_t.account_t,
    private broker_name: broker_t,
  ) {
    super();
  }

  map = () => {
    let a: saxo_t.account_t | ibkr_t.account_t;
    let account: account_t;
    switch (this.broker_name) {
      case "saxo":
        a = this.account as saxo_t.account_t;
        account = {
          a_id: `${this.broker_name}_${a.AccountId}`,
          a_id_original: a.AccountId,
          broker: this.broker_name,
          alias: a.DisplayName,
          currency: a.Currency.toUpperCase().slice(0, 3),
        } as account_t;
        break;
      case "ibkr":
        a = this.account as ibkr_t.account_t;
        account = {
          a_id: `${this.broker_name}_${a.accountId}`,
          a_id_original: a.accountId,
          broker: this.broker_name,
          alias: a.accountAlias,
          currency: (a.accountVan || a.currency).toUpperCase().slice(0, 3),
        } as account_t;
        break;
      default:
        account = {} as account_t;
    }
    return account;
  };
}
