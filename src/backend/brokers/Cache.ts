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
      return (this._transctns = transctns.reduce(
        (c, transctn) => {
          const { i_id } = transctn;
          if (!c[i_id]) c[i_id] = [];
          c[i_id].push(transctn);
          return c;
        },
        {} as { [i_id: i_id_t]: transctn_t[] },
      ));
    });
  }
  public get instruments() {
    if (this._instrumnts) return Promise.resolve(this._instrumnts);
    return this.db.select.instruments().then((instrmnts) => {
      if (!instrmnts.length) throw Error(err_m("Instruments"));
      return (this._instrumnts = instrmnts.reduce(
        (c, instrmnt) => {
          const { i_id } = instrmnt;
          c[i_id] = instrmnt;
          return c;
        },
        {} as { [i_id: i_id_t]: instrmnt_t },
      ));
    });
  }
  public get positions() {
    if (!this._positns) throw Error(err_m("Positions"));
    return this._positns;
  }
  public get i_ids() {
    return Object.keys(this.positions) as i_id_t[];
    //  const postn = this.positions[p_id]!;
    //  return postn.i_id;
    //}));
  }
  public get live_data() {
    if (!this._live_data) throw Error(err_m("Live data"));
    return this._live_data;
  }

  public set positions(positns: cache_posns_t) {
    if (!this._positns) this._positns = {};
    Object.keys(positns).forEach((i_id) => {
      let pos = positns[i_id as i_id_t]!;
      const ex_pos = this._positns![i_id as i_id_t]
        ? this._positns![i_id as i_id_t]
        : {};
      pos = { ...pos, ...ex_pos };
      this._positns![i_id as i_id_t] = pos;
    });
  }
  public set live_data(data: cache_t["live_data"]) {
    this._live_data = data;
  }

  public set_instruments = async (instruments: instrmnt_t[]) => {
    delete this._instrumnts;
    await this.db.insert.instruments(instruments);
  };
  public set_transctns = async (transactions: transctn_t[]) => {
    delete this._transctns;
    await Promise.resolve(transactions).then(this.db.insert.transactions);
  };
  public set_accounts = async (accounts: cache_t["accounts"]) => {
    delete this._accounts;
    await Promise.resolve(accounts).then(this.db.insert.accounts);
  };

  private _transctns?: cache_t["transactions"];
  private _instrumnts?: cache_t["instruments"];
  private _accounts?: cache_t["accounts"];
  private _live_data?: cache_t["live_data"];
  private _positns?: cache_posns_t;
}

function err_m(subject: string) {
  return `${subject} must be set before proceeding`;
}

type cache_posns_t = { [i_id: i_id_t]: b.positn_t };
