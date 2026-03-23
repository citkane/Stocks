import { Global } from "@backend/Global";

export class CacheBrokers extends Global {
  public get fx_rates() {
    return Promise.resolve(CacheBrokers._fx_rates);
  }
  public get accounts() {
    return Promise.all([
      this.ibkr.cache.accounts,
      this.saxo.cache.accounts,
    ]).then((accs) => accs.flat());
  }
  public get positions() {
    return Promise.all([
      this.ibkr.cache.positions,
      this.saxo.cache.positions,
    ]).then((pos) => pos.flat());
  }
  public static set fx_rates(rates: Promise<fx_rates_t>) {
    rates.then((r) => (this._fx_rates = r));
  }
  private static _fx_rates = {} as fx_rates_t;
}

export class CacheBroker extends Global {
  public get positions() {
    return Promise.resolve([...this._positions.values()]);
  }
  public get accounts() {
    return Promise.resolve([...this._accounts.values()]);
  }
  public get account_ids() {
    return Promise.resolve([...this._accounts.keys()]);
  }

  public set accounts(accs: Promise<account_t[]>) {
    accs.then(async (accs) => {
      await this.db.insert.accounts(accs);
      accs.forEach(this.setter.account);
    });
  }
  public set positions(pos: Promise<position_t[]>) {
    pos.then(async (pos) => {
      await this.db.insert.positions(pos);
      pos.forEach(this.setter.position);
    });
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
