import { Global } from "backend";

export class Accounts extends Global {
  public update = () =>
    this.ibkr.fetch<ibkr_t.account_t[]>(this.endpoints.accounts());

  private endpoints = {
    accounts: () => `${this.api_url}/portfolio/accounts`,
  };
  private get api_url() {
    return util.url.ibkr.api;
  }
}

export class Account extends Global {
  constructor(private account: ibkr_t.account_t) {
    super();
  }
  translate() {
    return {
      a_id: `ibkr_${this.account.accountId}`,
      a_id_original: this.account.accountId,
      broker: "ibkr",
      alias: this.account.accountAlias,
      currency: (this.account.accountVan || this.account.currency)
        .toUpperCase()
        .slice(0, 3),
    } as account_t;
  }
}
