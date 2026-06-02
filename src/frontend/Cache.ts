import { Money } from "@frontend/components/common";
export default class Cache {
  public get ready() {
    const ready = !!this.accounts && !!this.instruments && !!this._transctns;
    return ready;
  }
  public get = {
    accounts: (broker: broker_t) => {
      return this.accounts.filter((a) => a.broker === broker);
    },
    a_ids: (broker: broker_t) => {
      return [
        ...new Set(this.get.accounts(broker).map((a) => a.a_id)).values(),
      ];
    },
    balances: (a_id: string) => {
      const err = `Account ${a_id} not found`;
      if (!this._accounts.has(a_id)) throw Error(err);
      return this._accounts.get(a_id)!;
    },
    instrument: (i_id: i_id_t) => {
      const err = `Instrument ${i_id} not found`;
      if (!this._instrmnts.has(i_id)) throw Error(err);
      return this._instrmnts.get(i_id)!;
    },
    transactions: (i_id: i_id_t) => {
      if (!this._transctns.has(i_id)) {
        const warn = `Transactions for ${i_id} not found, unbooked`;
        logger.warn(warn);
        return [Money.unbooked_transctn(i_id)];
      }
      return [...this._transctns.get(i_id)!.values()];
    },
  };
  public get a_ids() {
    return [...this._accounts.keys()];
  }
  public get account_brokers() {
    return [...new Set(this.accounts.map((a) => a.broker)).values()];
  }
  public get accounts() {
    return [...this._accounts.values()].flat();
  }
  public get instruments() {
    return this._instrmnts.keys().reduce(
      (c, i_id) => {
        const instrmnt = this._instrmnts.get(i_id)!;
        c[i_id] = instrmnt;
        return c;
      },
      {} as { [i_id: i_id_t]: instrmnt_t },
    );
  }
  public get transactions() {
    return this._transctns.keys().reduce(
      (c, i_id) => {
        const transctns = this._transctns.get(i_id)!;
        c[i_id] = [...transctns.values()];
        return c;
      },
      {} as { [i_id: i_id_t]: transctn_t[] },
    );
  }
  public get exchanges() {
    if (this._exchgs) return this._exchgs;
    const exchngs = this._instrmnts.values().map((i) => i.exchange);
    return (this._exchgs = [...new Set(exchngs).values()]);
  }
  public get fx() {
    return this._fx!;
  }
  public get filter() {
    return Cache._filter;
  }
  public get asset_industries() {
    if (this._industries) return this._industries;
    const sectors = this._instrmnts.values().reduce(
      (c, i) => {
        if (!i.asset_sector) return c;
        if (!c[i.asset_sector!]) c[i.asset_sector!] = [];
        c[i.asset_sector!]?.push(i.asset_industry!);
        return c;
      },
      {} as { [key: string]: string[] },
    );
    const industries = Object.keys(sectors).reduce(
      (c, sector) => {
        const industries = [...new Set(sectors[sector]!).values()];
        industries.forEach((industry) => {
          c.push([sector, industry]);
        });
        return c;
      },
      [] as [string, string][],
    );
    return (this._industries = industries.sort((a, b) =>
      a[1]!.localeCompare(b[1]),
    ));
  }
  public set accounts(accounts: (account_t | balance_t)[]) {
    const _accounts = accounts.reduce(
      (c, acc) => {
        const { a_id } = acc;
        if (!c[a_id]) c[a_id] = [];
        c[a_id].push(acc);
        return c;
      },
      {} as { [a_id: string]: (account_t | balance_t)[] },
    );

    Object.keys(_accounts).forEach((a_id) =>
      this._accounts.set(a_id, _accounts[a_id]!),
    );
  }
  public set transactions(_transctns: cache_t["transactions"]) {
    Object.keys(_transctns).forEach((_i_id) => {
      const i_id = _i_id as i_id_t;
      const transcts = _transctns[i_id]!;
      this._transctns.set(i_id, new Set(transcts));
    });
  }
  public set instruments(instruments: { [i_id: i_id_t]: instrmnt_t }) {
    delete this._asset_classes;
    delete this._sectors;
    delete this._industries;
    Object.keys(instruments).forEach((_i_id) => {
      const i_id = _i_id as i_id_t;
      const instrmnt = instruments[i_id]!;
      const _instrumnt = {
        ...(this._instrmnts.get(i_id) || {}),
        ...instrmnt,
      };
      this._instrmnts.set(i_id, _instrumnt);
    });
  }
  public set fx(fx: fx_rates_t) {
    this._fx = fx;
  }
  public set live_data(data: cache_t["live_data"]) {
    this.fx = data.fx!;
    data.data?.forEach((data) => {
      let { price_market, div_yield, i_id } = data;
      div_yield = div_yield || 0;

      const _transcts = this._transctns.get(i_id);
      let instrmnt = this._instrmnts.get(i_id)!;
      if (!instrmnt) console.warn(i_id);
      instrmnt = { ...instrmnt, ...{ div_yield } };
      const transctns = [...(_transcts?.values() || [])].map((t) => {
        const { currency } = t;
        const fx_market = this.fx[currency]!;
        return t.kind === "buy"
          ? { ...t, ...{ price_market, fx_market } }
          : { ...t, ...{ fx_market } };
      });

      this._instrmnts.set(i_id, instrmnt);
      this._transctns.set(i_id, new Set(transctns));
    });
    Object.keys(data.balances!).forEach((a_id) =>
      this._accounts.set(a_id, data.balances![a_id]!),
    );
  }

  public static _filter = {} as f.filter_t;
  public selector?: f.selector_i;

  private _accounts = new Map<string, (balance_t | account_t)[]>();
  private _instrmnts = new Map<i_id_t, instrmnt_t>();
  private _transctns = new Map<i_id_t, Set<transctn_t>>();
  private _exchgs?: string[];
  private _sectors?: string[];
  private _industries?: [string, string][];
  private _asset_classes?: string[];
  private _fx?: fx_rates_t;
}
