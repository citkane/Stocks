import { Global } from "@backend/Global";

export class CacheIbkr extends Global {
  public get a_ids() {
    return this.accounts.map((a) => a.a_id_original);
  }
  public get conids() {
    if (!this.positn_map) throw Error(err_m("positions"));
    return [...this.positn_map.keys()].map((conid) => String(conid));
  }

  public get instruments() {
    return this.instrmnt_map;
  }

  public get = {
    position: (conid: number) => {
      if (!this.positn_map) throw Error(err_m("positions"));
      return this.positn_map.get(conid);
    },
    instrument: (conid: number) => {
      return this.instrmnt_map.get(conid);
    },
  };
  public get accounts() {
    if (!this._accounts) throw Error(err_m("accounts"));
    return this._accounts;
  }

  public set positions(positns: { [p_id: p_id_t]: b.positn_t }) {
    if (!this.positn_map) this.positn_map = new Map();
    Object.values(positns).forEach((positn) => {
      const { ibkr_id } = positn;
      this.positn_map!.set(ibkr_id!, positn);
    });
    this.brokers.cache.positions = positns;
  }
  public set_instruments(instrmnts: instrmnt_t[]) {
    this.brokers.cache.set_instruments(instrmnts);
    instrmnts.forEach((instrmnt) => {
      const { ibkr_id } = instrmnt;
      this.instrmnt_map.set(ibkr_id!, instrmnt);
    });
  }
  public set accounts(accounts: cache_t["accounts"]) {
    this._accounts = accounts;
    this.brokers.cache.accounts = accounts;
  }

  private instrmnt_map = new Map<number, instrmnt_t>();
  private positn_map?: Map<number, b.positn_t>;
  private _accounts?: cache_t["accounts"];
}

function err_m(subject: string) {
  return `IBKR ${subject} must be set before proceeding`;
}
