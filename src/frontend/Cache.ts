export class Cache {
  public get ready() {
    const ready = !!this.accounts && !!this.instruments && !!this._transctns;
    return ready;
  }
  public get = {
    account: (a_id: string) => {
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
      const err = `Transactions for ${i_id} not found`;
      if (!this._transctns.has(i_id)) throw Error(err);
      return [...this._transctns.get(i_id)!.values()];
    },
  };
  public get accounts() {
    return [...this._accounts.values()];
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
  public get asset_classes() {
    if (this._asset_classes) return this._asset_classes;
    const classes = [...this._instrmnts.values()]
      .filter((i) => !!i.asset_class)
      .map((i) => i.asset_class!)
      .sort((a, b) => a.localeCompare(b));
    return (this._asset_classes = [...new Set(classes).values()]);
  }
  public get asset_sectors() {
    if (this._sectors) return this._sectors;
    const sectors = [...this._instrmnts.values()]
      .filter((i) => !!i.asset_sector)
      .map((i) => i.asset_sector!)
      .sort((a, b) => a.localeCompare(b));
    return (this._sectors = [...new Set(sectors).values()]);
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
  public set accounts(accounts: account_t[]) {
    accounts.forEach(this.add.account);
    logger.info("Cache accounts updated");
  }
  public set transactions(_transctns: { [i_id: i_id_t]: transctn_t[] }) {
    Object.keys(_transctns).forEach((_i_id) => {
      const i_id = _i_id as i_id_t;
      const transcts = _transctns[i_id]!;
      this._transctns.set(i_id, new Set(transcts));
    });
    logger.info("Cache transactions updated");
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
    logger.info("Cache instruments updated");
  }
  public set live_data(data: live_data_t[]) {
    data.forEach((data) => {
      let { price_market, fx_market, div_yield, i_id } = data;
      div_yield = div_yield || 0;

      const _transcts = this._transctns.get(i_id)!;
      let instrmnt = this._instrmnts.get(i_id)!;

      instrmnt = { ...instrmnt, ...{ div_yield } };
      const transctns = [..._transcts.values()].map((t) => {
        t =
          t.kind === "buy"
            ? { ...t, ...{ price_market, fx_market } }
            : { ...t, ...{ fx_market } };
        return t;
      });

      this._instrmnts.set(i_id, instrmnt);
      this._transctns.set(i_id, new Set(transctns));
    });
    logger.info("Live data updated");
  }

  private add = {
    account: (account: account_t) => {
      const { a_id } = account;
      this._accounts.set(a_id, account);
    },
  };
  private _accounts = new Map<string, account_t>();
  private _instrmnts = new Map<i_id_t, instrmnt_t>();
  private _transctns = new Map<i_id_t, Set<transctn_t>>();
  private _exchgs?: string[];
  private _sectors?: string[];
  private _industries?: [string, string][];
  private _asset_classes?: string[];
}

//type instrmnt_set_t = instrmt_trnscts_t<Set<transctn_t>>;
