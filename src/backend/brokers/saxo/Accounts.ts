import { Global } from "backend";

const api = "port/v1";

export default class Accounts extends Global {
  public get_accounts = () =>
    this.saxo
      .fetch<saxo_t.accounts_t>(this.endpoints.accounts())
      .then((data) => data.Data);

  private endpoints = {
    accounts: () => `${api}/accounts`,
  };
}
