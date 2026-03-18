import { Global } from "@backend/Global";

export class CacheBrokers extends Global {
  public get fx_rates() {
    return CacheBrokers._fx_rates;
  }
  public get accounts() {
    return [...this.ibkr.cache.accounts, this.saxo.cache.accounts];
  }
  public get positions() {
    return [...this.ibkr.cache.positions, this.saxo.cache.positions];
  }
  public static set fx_rates(rates: fx_rates_t) {
    this._fx_rates = rates;
  }
  private static _fx_rates = {} as fx_rates_t;
}

export class CacheBroker extends Global {
  public get positions() {
    return [...this._positions.values()];
  }
  public get accounts() {
    return [...this._accounts.values()];
  }
  public get account_ids() {
    return [...this._accounts.keys()];
  }
  public get fx_rates() {
    return CacheBrokers.fx_rates;
  }
  public set accounts(accs: account_t[]) {
    this.db.insert.accounts(accs);
    accs.forEach(this.setter.account);
  }
  public set positions(pos: position_t[]) {
    console.log({ pos });
    this.db.insert.positions(pos);
    pos.forEach(this.setter.position);
  }

  protected setter = {
    account: (a: account_t) => {
      const { a_id_original } = a;
      this._accounts.set(a_id_original, a);
    },
    position: (p: position_t) => {
      const { p_id } = p;
      this._positions.set(p_id, p);
    },
  };
  private _accounts = new Map<string, account_t>();
  private _positions = new Map<string, position_t>();
}
