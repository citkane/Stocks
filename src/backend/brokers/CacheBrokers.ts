import { Global } from "@backend/Global";

export class CacheBrokers extends Global {
  public get accounts() {
    if (!this._accounts) throw Error(err_m("Accounts"));
    return this._accounts;
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

      this.set_instruments(instrmnts);
      return this._instrumnts!;
    });
  }
  public get positions() {
    if (!this._positns) throw Error(err_m("Positions"));
    return this._positns;
  }
  public get i_ids() {
    return Object.keys(this.positions) as i_id_t[];
  }
  public get live_data() {
    if (!this._live_data?.data || !this._live_data?.balances)
      throw Error(err_m("Live data"));
    this._live_data.fx = this.fx;
    return this._live_data;
  }
  public get fx() {
    if (!this._fx) throw Error(err_m("FX"));
    return this._fx;
  }
  public get currencies() {
    if (this._currencies) return this._currencies;
    let currencies: currency_t[] = Object.values(this.positions).map(
      (p) => p.currency,
    );
    currencies = [...new Set(currencies).values()] as currency_t[];
    return (this._currencies = currencies);
  }

  public set_instruments(instruments: instrmnt_t[]) {
    if (!this._instrumnts) this._instrumnts = {};
    instruments.forEach((instrmnt) => {
      const { i_id } = instrmnt;
      const ex_instrmnt = this._instrumnts![i_id] || {};
      instrmnt = { ...ex_instrmnt, ...instrmnt };
      this._instrumnts![i_id] = instrmnt;
    });
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
  public set live_data_data(data: cache_t["live_data"]["data"]) {
    if (!this._live_data) this._live_data = {};
    this._live_data!.data = data;
  }
  public set live_data_balances(balances: balance_t[]) {
    if (!this._live_data) this._live_data = {};
    if (!this._live_data.balances) this._live_data!.balances = {};
    const ex_balances = this._live_data!.balances!;
    const new_balances = balances.reduce(
      (c, balance) => {
        const { a_id } = balance;
        if (!c[a_id]) c[a_id] = [];
        c[a_id].push(balance);
        return c;
      },
      {} as { [a_id: string]: balance_t[] },
    );

    this._live_data!.balances = { ...ex_balances, ...new_balances };
  }
  public set accounts(accounts: cache_t["accounts"]) {
    this._accounts = [
      ...new Set([...(this._accounts || []), ...accounts]).values(),
    ];
  }
  public set fx(fx: fx_rates_t) {
    this._fx = fx;
  }
  public set_transctns = async (transactions: transctn_t[]) => {
    this.invalidate.fx();
    await this.db.insert.transactions(transactions);
  };

  public invalidate = {
    instruments: () => {
      delete this._instrumnts;
      delete this._currencies;
    },
    fx: () => {
      delete this._transctns;
    },
  };

  private _transctns?: cache_t["transactions"];
  private _instrumnts?: cache_t["instruments"];
  private _accounts?: cache_t["accounts"];
  private _live_data?: cache_t["live_data"];
  private _positns?: cache_posns_t;
  private _currencies?: currency_t[];
  private _fx?: fx_rates_t;
}

function err_m(subject: string) {
  return `${subject} must be set before proceeding`;
}

type cache_posns_t = { [i_id: i_id_t]: b.positn_t };
