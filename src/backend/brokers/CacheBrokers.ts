import { Global } from "@backend/Global";

export class CacheBrokers extends Global {
  public live_ready = () => {
    return !!this.mem.forex && !!this.mem.instrument_data;
  };

  public get accounts() {
    const { mem, set } = this;
    return !mem.accounts ? set.accounts() : Promise.resolve(mem.accounts);
  }
  public get transactions() {
    const { mem, set } = this;
    return !mem.transactions
      ? set.transactns()
      : Promise.resolve(mem.transactions);
  }
  public get instruments() {
    const { mem, set } = this;
    return !mem.instruments
      ? set.instruments()
      : Promise.resolve(mem.instruments);
  }
  public get currencies() {
    const { mem, set } = this;
    return !mem.currencies ? set.currencies() : Promise.resolve(mem.currencies);
  }
  public get forex() {
    const { mem, set } = this;
    return !mem.forex ? set.forex() : Promise.resolve(mem.forex);
  }
  public get instrument_data() {
    const { mem, set } = this;
    return !mem.instrument_data
      ? set.instrument_data()
      : Promise.resolve(mem.instrument_data);
  }
  public get balances() {
    const { mem, set } = this;
    return !mem.balances ? set.balances() : Promise.resolve(mem.balances);
  }
  public get live_data(): Promise<cache_t["live_data"]> {
    const promise = [this.forex, this.instrument_data, this.balances] as const;
    return Promise.all(promise)
      .then(merge_fx)
      .then(([instrmnts, balances]) => {
        return { instrmnts, balances } as cache_t["live_data"];
      });

    function merge_fx([forex, ins_data, balances]: [
      cache_t["forex"],
      cache_t["instrument_data"],
      cache_t["balances"],
    ]) {
      return Promise.all(
        [ins_data, balances].map((data) => merge(data, forex)),
      );
    }

    function merge<
      T extends "instrument_data" | "balances",
      D extends live_data_t["balances" | "instrmnts"] = T extends "balances"
        ? live_data_t["balances"]
        : live_data_t["instrmnts"],
    >(data: cache_t[T], forex: cache_t["forex"]): D {
      const merged = structuredClone(data) as unknown as D;
      const entries = Object.entries(merged);
      return entries.reduce((merged_data, entry) => {
        const [id, data] = entry as [string, { currency: string; fx: number }];
        const { currency } = data;
        data.fx = forex[currency]?.close || 1;
        (merged_data as any)[id] = data;
        return merged_data;
      }, merged);
    }
  }

  public set forex(forex: Promise<cache_t["forex"]>) {
    forex.then((f) => (this.mem.forex = f));
  }
  public set instrument_data(data: Promise<cache_t["instrument_data"]>) {
    data.then((d) => (this.mem.instrument_data = d));
  }

  public set = {
    currencies: async () => {
      const { mem } = this;
      const instrmnts = await this.instruments;
      let currencies = Object.values(instrmnts).map((i) => i.currency);
      mem.currencies = [...new Set(currencies).values()];
      return mem.currencies;
    },
    instruments: async () => {
      const { mem } = this;
      const instrmnts = await Promise.all(
        conf.brokers.map((b) => this[b].cache.instruments),
      )
        .then((maps) => maps.map((i) => [...i.values()]))
        .then((i) => i.flat());

      mem.instruments = instrmnts.reduce((cache, instrmnt) => {
        const { i_id } = instrmnt;
        const ex_instrmnt = cache[i_id] || {};
        instrmnt = { ...ex_instrmnt, ...instrmnt };
        cache[i_id] = instrmnt;
        return cache;
      }, mem.instruments || {});
      return mem.instruments;
    },
    transactns: async () => {
      const { mem, db } = this;
      const transctns = await db.select.transactions();
      mem.transactions = transctns.reduce((cache, transctn) => {
        const { i_id } = transctn;
        if (!cache[i_id]) cache[i_id] = [];
        cache[i_id].push(transctn);
        return cache;
      }, mem.transactions || {});
      return mem.transactions;
    },
    accounts: async () => {
      const { mem } = this;
      const accounts = await Promise.all(
        conf.brokers.map((b) => this[b].cache.accounts),
      ).then((a) => a.flat());
      mem.accounts = accounts.map((account) => {
        account = structuredClone(account);
        delete account.broker_key;
        return account;
      });
      return mem.accounts;
    },
    forex: async () => {
      const { mem, db } = this;
      mem.forex = await db.select.forex();
      return mem.forex;
    },
    instrument_data: async () => {
      const { mem, db } = this;
      mem.instrument_data = await db.select.instrument_data();
      return mem.instrument_data;
    },
    balances: async () => {
      const { mem, db } = this;
      mem.balances = await db.select.balances();
      return mem.balances;
    },
  };

  public invalidate = {
    instruments: () => {
      console.warn("instruments invalidated");
      delete this.mem.instruments;
      this.invalidate.currencies();
    },
    transactions: () => {
      delete this.mem.transactions;
    },
    currencies: () => {
      delete this.mem.currencies;
    },
    accounts: () => {
      delete this.mem.accounts;
    },
  };
  private mem = {} as {
    transactions?: cache_t["transactions"];
    instruments?: cache_t["instruments"];
    accounts?: cache_t["accounts"];
    currencies?: string[];
    instrument_data?: cache_t["instrument_data"];
    forex?: cache_t["forex"];
    balances?: cache_t["balances"];
  };
}
