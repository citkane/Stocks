export class Cache {
  public add = {
    account: (account: account_t) => {
      const { a_id } = account;
      this._accounts.set(a_id, account);
    },
  };
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
    //transactions: (ticker: string) => {
    //  const err = `Transactions for ${ticker} not found`;
    //  if (!this._transctns.has(ticker)) throw Error(err);
    //  return [...this._transctns.get(ticker)!.values()];
    //},
  };
  public set accounts(accounts: account_t[]) {
    accounts.forEach(this.add.account);
  }
  public get accounts() {
    return [...this._accounts.values()];
  }
  public get instruments() {
    return [...this._instrmnts.values()];
  }
  public get exchanges() {
    if (this._exchgs) return this._exchgs;
    const exchngs = this.instruments.map((i) => i.exchange);
    return (this._exchgs = [...new Set(exchngs).values()]);
  }
  public get asset_classes() {
    if (this._asset_classes) return this._asset_classes;
    const classes = this.instruments
      .filter((i) => !!i.asset_class)
      .map((i) => i.asset_class!);
    return (this._asset_classes = [...new Set(classes).values()]);
  }
  public get asset_sectors() {
    if (this._sectors) return this._sectors;
    const sectors = this.instruments
      .filter((i) => !!i.asset_sector)
      .map((i) => i.asset_sector!);
    return (this._sectors = [...new Set(sectors).values()]);
  }
  public get asset_industries() {
    if (this._industries) return this._industries;
    const sectors = this.instruments.reduce(
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
    return (this._industries = industries);
  }

  public set transactions(transctns: transctn_t[]) {
    transctns.forEach((t) => {
      const i_id: i_id_t = `${t.exchange}-${t.ticker}`;
      if (!this._transctns.has(i_id)) this._transctns.set(i_id, new Set());
      const transctns = this._transctns.get(i_id)!;
      transctns.add(t);
    });
  }
  public get transactions() {
    return [...this._transctns.values()].map((set) => [...set.values()]).flat();
  }

  public set instruments(instruments: instrmnt_t[]) {
    delete this._asset_classes;
    delete this._sectors;
    delete this._industries;

    instruments.forEach((instrument) => {
      const { i_id } = instrument;
      const _instrument = {
        ...(this._instrmnts.get(i_id) || {}),
        ...instrument,
      };
      this._instrmnts.set(i_id, _instrument);
    });
  }
  public set live_data(data: live_data_t[]) {
    data.forEach((data) => {
      const _transcts = this._transctns.get(data.i_id);
      if (!_transcts) return console.warn(`No transactions for ${data.i_id}`);
      const { price_market, fx_market } = data;

      const transctns = [..._transcts.values()].map((t) => {
        t =
          t.kind === "buy"
            ? { ...t, ...{ price_market, fx_market } }
            : { ...t, ...{ fx_market } };
        return t;
      });
      this._transctns.set(data.i_id, new Set(transctns));
      console.log(transctns);
    });
  }

  private _accounts = new Map<string, account_t>();
  private _instrmnts = new Map<i_id_t, instrmnt_t>();
  private _transctns = new Map<i_id_t, Set<transctn_t>>();
  private _exchgs?: string[];
  private _sectors?: string[];
  private _industries?: [string, string][];
  private _asset_classes?: string[];
}

//type instrmnt_set_t = instrmt_trnscts_t<Set<transctn_t>>;
