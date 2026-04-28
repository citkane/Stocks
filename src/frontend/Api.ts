import { Global } from "@frontend/Global";

export default class Api extends Global implements Api_t {
  requests = {
    topics: (p: req_t) => p.messenger.response(p.req_uid, this.topics),
  };
  setter = {
    shutdown: () => window.close(),
    instruments: (ins: cache_t["instruments"]) => this.set_instrmnts(ins),
    transactions: (trns: cache_t["transactions"]) => this.set_transctns(trns),
    accounts: (accs: cache_t["accounts"]) => this.set_accounts(accs),
    live_data: (data: cache_t["live_data"]) => this.set_live_data(data),
    cache: (data: cache_t) => this.set_cache(data),
  };

  private set_transctns = (transactions: cache_t["transactions"]) => {
    this.cache.transactions = transactions;
    const data = util.hash_id(this.cache.transactions);
    this.root_app.setAttribute("transactions", data);
  };
  private set_instrmnts = (instruments: cache_t["instruments"]) => {
    this.cache.instruments = instruments;
    const data = util.hash_id(this.cache.instruments);
    this.root_app.setAttribute("instruments", data);
  };
  private set_accounts = (accounts: cache_t["accounts"]) => {
    this.cache.accounts = accounts;
    const data = util.hash_id(this.cache.accounts);
    this.root_app.setAttribute("accounts", data);
  };
  private set_live_data = (live_data: cache_t["live_data"]) => {
    this.cache.live_data = live_data;
    this.set_instrmnts(this.cache.instruments);
    this.set_transctns(this.cache.transactions);
  };
  private set_cache = (data: cache_t) => {
    const { accounts, instruments, transactions, live_data } = data;
    this.set_accounts(accounts);
    this.set_instrmnts(instruments);
    this.set_transctns(transactions);
    this.set_live_data(live_data);
    logger.info("Cache ready");
  };
  private get topics() {
    return Object.keys(this.setter);
  }
}
