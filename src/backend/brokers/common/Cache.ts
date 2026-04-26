import { Global } from "@backend/Global";

export class Cache extends Global {
  public get accounts() {
    if (this._accounts) return Promise.resolve(this._accounts);
    return this.db.select.accounts().then((accounts) => {
      if (!accounts.length) throw Error(err_m("Accounts"));
      return (this._accounts = accounts);
    });
  }
  public get transactions() {
    if (this._transctns) return Promise.resolve(this._transctns);
    return this.db.select.transctns().then((transctns) => {
      if (!transctns.length) throw Error(err_m("Transactions"));
      return (this._transctns = transctns);
    });
  }
  public get instruments() {
    if (this._instrumnts) return Promise.resolve(this._instrumnts);
    return this.db.select.instruments().then((instrumnts) => {
      if (!instrumnts.length) throw Error(err_m("Instruments"));
      return (this._instrumnts = instrumnts);
    });
  }
  public get positions() {
    if (!this._positns) throw Error(err_m("Positions"));
    return this._positns;
  }
  public get i_ids() {
    if (this._i_ids) this._i_ids;
    return (this._i_ids = this.p_ids.map((p_id) => {
      const postn = this.positions[p_id]!;
      return `${postn.exchange}-${postn.ticker}` as i_id_t;
    }));
  }
  public get p_ids() {
    if (!this._p_ids) throw Error(err_m("Positions"));
    return this._p_ids;
  }

  public set positions(positns: { [p_id: p_id_t]: b.positn_t }) {
    if (!this._positns) this._positns = {};
    Object.keys(positns).forEach((key) => {
      const k = key as p_id_t;
      const ex_p_ids = this._p_ids || [];
      const ex_pos = this._positns![k];
      const pos = positns[k]!;
      if (!!ex_pos) {
        pos.p_ids = [...new Set([...pos.p_ids, ...ex_pos.p_ids]).values()];
      }
      this._positns![k] = pos;
      this._p_ids = [...new Set([...ex_p_ids, ...pos.p_ids]).values()];
    });
  }

  public set_instruments(instruments: Promise<instrmnt_t[]>) {
    delete this._instrumnts;
    return Promise.resolve(instruments).then(this.db.insert.instruments);
  }
  public set_transctns(transactions: Promise<transctn_t[]>) {
    delete this._transctns;
    return Promise.resolve(transactions).then(this.db.insert.transactions);
  }
  public set_accounts(accounts: Promise<account_t[]>) {
    delete this._accounts;
    return Promise.resolve(accounts).then(this.db.insert.accounts);
  }

  private _transctns?: transctn_t[];
  private _instrumnts?: instrmnt_t[];
  private _accounts?: account_t[];
  private _positns?: { [p_id: p_id_t]: b.positn_t };
  private _p_ids?: p_id_t[];
  private _i_ids?: i_id_t[];
}

function err_m(subject: string) {
  return `${subject} must be set before proceeding`;
}
