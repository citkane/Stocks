import type { ibkr_t, saxo_t } from "../../../types";

export class Account {
  constructor(
    private account: saxo_t.account_t | ibkr_t.account_t,
    private broker: broker_t,
  ) {}

  map = () => {
    let a: saxo_t.account_t | ibkr_t.account_t;
    let account: account_t;
    switch (this.broker) {
      case "saxo":
        a = this.account as saxo_t.account_t;
        account = {
          id: `${this.broker}_${a.AccountId}`,
          original_id: a.AccountId,
          broker: this.broker,
          alias: a.DisplayName,
          currency: a.Currency.toUpperCase().slice(0, 3),
        } as account_t;
        break;
      case "ibkr":
        a = this.account as ibkr_t.account_t;
        account = {
          id: `${this.broker}_${a.accountId}`,
          original_id: a.accountId,
          broker: this.broker,
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
