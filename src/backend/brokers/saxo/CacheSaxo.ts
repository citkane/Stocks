import { Global } from "@backend/Global";

export class CacheSaxo extends Global {
  // public get saxo_a_ids() {
  //   return this.accounts.then((accs) => accs.map((a) => a.a_id.split("_")[1]!));
  // }
  //public get broker_keys() {
  //  return this.accounts.then((accs) =>
  //    accs.map((a) => ({
  //      key: a.broker_key!,
  //      a_id: a.a_id,
  //    })),
  //  );
  //}
  public get accounts() {
    const { mem, set } = this;
    return !mem.accounts ? set.accounts() : Promise.resolve(mem.accounts);
  }
  public get instruments() {
    const { mem, set } = this;
    return !mem.instruments
      ? set.instruments()
      : Promise.resolve(mem.instruments);
  }

  public get = {
    instrument: async (saxo_id: number) =>
      this.instruments.then((i) => i.get(saxo_id)),
  };
  private set = {
    instruments: async () => {
      const { mem, db } = this;
      const instrmnts = await db.select.instruments();
      mem.instruments = instrmnts.reduce((cache, instrmnt) => {
        const { saxo_id } = instrmnt;
        cache.set(saxo_id!, instrmnt);
        return cache;
      }, mem.instruments || new Map());
      return mem.instruments;
    },
    accounts: async () => {
      const { mem, db } = this;
      mem.accounts = await db.select.accounts("saxo");
      return mem.accounts;
    },
  };
  public invalidate = {
    instruments: () => {
      delete this.mem.instruments;
      this.brokers.cache.invalidate.instruments();
      return true;
    },
    accounts: () => {
      delete this.mem.accounts;
      this.brokers.cache.invalidate.accounts();
      return true;
    },
  };
  private mem = {} as {
    instruments?: Map<number, instrmnt_t>;
    accounts?: cache_t["accounts"];
  };
}
