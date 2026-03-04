import type { Saxo } from "backend";
import type { saxo_t } from "types";

export class Accounts {
  constructor(private saxo: Saxo) {}
  public get_accounts = () =>
    this.saxo
      .fetch(this.endpoints.accounts())
      .then((res) => res.json())
      .then((data: saxo_t.accounts_t) => data.Data)
      .catch((err) => {
        console.error(err);
        throw err;
      });

  private endpoints = {
    accounts: () => "accounts",
  };
}
