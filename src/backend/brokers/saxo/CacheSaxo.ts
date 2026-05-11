import { Global } from "@backend/Global";

export class CacheSaxo extends Global {
  public get a_ids() {
    return this.accounts.map((a) => a.a_id_original);
  }
  public get a_keys() {
    return this.accounts.map((a) => ({
      key: a.saxo_key!,
      a_id: a.a_id,
    }));
  }
  public get accounts() {
    if (!this._accounts) throw Error(err_m("accounts"));
    return this._accounts;
  }

  public position = (uic: number) => {
    if (!this.positn_map) throw Error(err_m("positions"));
    return this.positn_map.get(uic);
  };

  public set positions(positns: { [p_id: p_id_t]: b.positn_t }) {
    if (!this.positn_map) this.positn_map = new Map();
    Object.values(positns).forEach((positn) => {
      const saxo_id = positn.saxo_id!;
      this.positn_map!.set(saxo_id, positn);
    });
    this.brokers.cache.positions = positns;
  }
  public set accounts(accounts: cache_t["accounts"]) {
    this._accounts = accounts;
    this.brokers.cache.accounts = accounts.map((a) => {
      const account = structuredClone(a);
      delete account.saxo_key;
      return account;
    });
  }

  private positn_map?: Map<number, b.positn_t>;
  private _accounts?: cache_t["accounts"];
}

function err_m(subject: string) {
  return `SAXO ${subject} must be set before proceeding`;
}
