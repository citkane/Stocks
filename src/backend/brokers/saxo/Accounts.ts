import type { Saxo } from "backend";
import type { saxo_t } from "types";

export class Accounts {
  constructor(private saxo: Saxo) {}
  public get_accounts = () =>
    this.saxo
      .fetch<saxo_t.accounts_t>(this.endpoints.accounts())
      .then((data) => data.Data);

  private endpoints = {
    accounts: () => "accounts",
  };
}
