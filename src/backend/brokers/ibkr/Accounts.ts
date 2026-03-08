import type { Ibkr } from "backend";
import type { ibkr_t } from "types";

export class Accounts {
  constructor(private ibkr: Ibkr) {}

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
