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

  public get transactions() {
    if (this._transactions) return Promise.resolve(this._transactions);
    return this.transactions_part
      .then(this.market_data.map)
      .then((transactions) => {
        this._transactions = transactions;
        return transactions;
      });
  }
  public get transactions_part() {
    if (this._transactions_part)
      return Promise.resolve([...this._transactions_part]);
    return this.db.select.transactions().then((transactions) => {
      this._transactions_part = new Set(transactions);
      return [...this._transactions_part];
    });
  }

  public static set fx_rates(rates: Promise<fx_rates_t>) {
    rates.then((r) => (this._fx_rates = r));
  }

  public set transactions_part(transactions: Promise<transaction_t[]>) {
    Promise.resolve(transactions).then(this.db.insert.transactions);
  }

  private market_data = {
    map: (transactions: transaction_t[]) => {
      const views = {} as { [key: string]: b.market_view_map_t };

      const promises = transactions.map(async (transaction) => {
        const { broker, p_id, currency } = transaction;
        if (!views[broker]) {
          views[broker] = await this[broker].cache.market_view;
        }
        const _views = views[broker];

        const fx_market = this.fx_rate(currency);
        const view = _views.get(p_id);

        transaction = !!view
          ? {
              ...transaction,
              ...{
                fx_market,
                price_market: view.price_market,
                state: "open",
              },
            }
          : {
              ...transaction,
              ...{
                fx_market,
                state: "closed",
              },
            };
        return this.market_data.fix_zar(transaction);
      });

      return Promise.all(promises);
    },
    // SAXO fucks up ZAR price rounding
    fix_zar: (transaction: transaction_t) => {
      const { broker, currency, price_market, price_traded } = transaction;
      if (!(broker === "saxo" && currency === "ZAR")) return transaction;

      transaction.price_market = price_market ? price_market / 100 : undefined;
      transaction.price_traded = price_traded ? price_traded / 100 : undefined;
      return transaction;
    },
  };

  private static _fx_rates = {} as fx_rates_t;
  private _transactions_part?: Set<transaction_t>;
  private _transactions?: transaction_t[];
}

export class CacheBroker extends Global {
  public get accounts() {
    return Promise.resolve([...this._accounts.values()]);
  }
  public get account_ids() {
    return Promise.resolve([...this._accounts.keys()]);
  }

  public async last_transaction_date(broker: broker_t) {
    const transactions = await this.db.select.transactions(broker);

    const latest = transactions[0]?.date as number;
    return latest ? util.string.epoch_to_iso_date(latest) : undefined;
  }

  public set accounts(accs: Promise<account_t[]>) {
    accs.then(async (accs) => {
      await this.db.insert.accounts(accs);
      accs.forEach(this.setter.account);
    });
  }

  protected setter = {
    account: (a: account_t) => {
      const { a_id_original } = a;
      this._accounts.set(a_id_original, a);
    },
  };
  private _accounts = new Map<string, account_t>();
}
