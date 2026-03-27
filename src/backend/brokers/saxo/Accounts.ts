import { Global } from "backend";

export class Accounts extends Global {
  constructor() {
    super();
  }
  public update = () =>
    this.saxo
      .fetch<b.s.accounts_t>(this.endpoints.accounts())
      .then((data) => data.Data);

  private endpoints = {
    accounts: () => `${this.api_url}/accounts`,
  };
  private get api_url() {
    return util.url.saxo.api;
  }
}

export class Account extends Global {
  constructor(private account: b.s.account_t) {
    super();
  }

  translate() {
    return {
      a_id: `saxo_${this.account.AccountId}`,
      a_id_original: this.account.AccountId,
      broker: "saxo",
      alias: this.account.DisplayName,
      currency: this.account.Currency.toUpperCase().slice(0, 3),
    } as account_t;
  }
}
