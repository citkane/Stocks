import { Global } from "backend";

export class Cache extends Global {
  get ibkr_accounts() {
    return this._ibkr_accounts.size ? [...this._ibkr_accounts.values()] : [];
  }
  get ibkr_positions() {
    return this._ibkr_positions.size ? [...this._ibkr_positions.values()] : [];
  }
  get ibkr_account_ids() {
    return [...this._ibkr_accounts.keys()];
  }

  get saxo_accounts() {
    return this._saxo_accounts.size ? [...this._saxo_accounts.values()] : [];
  }
  get saxo_positions() {
    return this._saxo_positions.size ? [...this._saxo_positions.values()] : [];
  }

  get accounts() {
    return [...this.saxo_accounts, ...this.ibkr_accounts];
  }
  set accounts(a: account_t[]) {
    a.forEach(this.add.account);
  }

  get positions() {
    return [...this.saxo_positions, ...this.ibkr_positions];
  }
  set positions(p: position_t[]) {
    p.forEach(this.add.position);
  }

  get fx_pairs() {
    return this._fx_pairs;
  }
  get has_fx_pairs() {
    return Object.keys(this._fx_pairs).length > 0;
  }
  set fx_pairs(pairs: fx_pairs_t) {
    this._fx_pairs = pairs;
  }

  add = {
    account: (a: account_t) => {
      const { a_id_original } = a;
      if (a.broker === "saxo") this._saxo_accounts.set(a_id_original, a);
      if (a.broker === "ibkr") this._ibkr_accounts.set(a_id_original, a);
    },
    position: (p: position_t) => {
      const { p_id } = p;
      if (p.broker === "saxo") this._saxo_positions.set(p_id, p);
      if (p.broker === "ibkr") this._ibkr_positions.set(p_id, p);
    },
  };
  private _saxo_accounts = new Map<string, account_t>();
  private _saxo_positions = new Map<string, position_t>();
  private _ibkr_accounts = new Map<string, account_t>();
  private _ibkr_positions = new Map<string, position_t>();
  private _fx_pairs: fx_pairs_t = {};
}
