import type { Ibkr } from "..";
import type { ibkr_t } from "../../../types";

export class Accounts {
  constructor(private ibkr: Ibkr) {}

  public get_accounts = () =>
    this.ibkr
      .fetch(this.endpoints.accounts())
      .then((res) => res.json())
      .then((accounts: ibkr_t.account_t[]) => accounts);

  private endpoints = {
    accounts: () => "portfolio/accounts",
  };
}
