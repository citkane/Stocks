import { Global } from "backend";

export default class Accounts extends Global {
  public get_accounts = () =>
    this.ibkr.fetch<ibkr_t.account_t[]>(this.endpoints.accounts());

  public get_fx = (source: currency_t, target: currency_t) =>
    this.ibkr.fetch<ibkr_t.fx_rate_t>(
      `${this.endpoints.fx()}?Source=${source}&Target=${target}`,
    );

  private endpoints = {
    accounts: () => "portfolio/accounts",
    fx: () => "iserver/exchangerate",
  };
}
