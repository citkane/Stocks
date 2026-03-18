import { Global } from "backend";
import { CacheBrokers } from "./CacheBrokers";

const currencies = ["ZAR", "CNH", "HKD", "CHF"] as const;
const base_currency = "EUR";

declare global {
  type currency_t = (typeof currencies)[number] | typeof base_currency;
  type fx_rates_t = { [T in currency_t]: ibkr_t.fx_rate_t };
}

export class Brokers extends Global {
  public init_brokers = () => {
    return Promise.all([this.ibkr.await_ready(), this.saxo.await_ready()]);
  };

  public fx_rate(currency: currency_t) {
    return this.cache.fx_rates[currency].rate;
  }
  public get currencies() {
    return currencies as unknown as currency_t[];
  }
  public get base_currency() {
    return base_currency as currency_t;
  }

  public cache = new CacheBrokers();
}
