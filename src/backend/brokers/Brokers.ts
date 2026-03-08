import { Saxo, Ibkr, type App } from "backend";

const currencies: currency_t[] = ["ZAR", "CNH", "HKD", "CHF"];
const base_currency: currency_t = "EUR";

export class Brokers {
  constructor(private app: App) {
    this.saxo = new Saxo(this.app);
    this.ibkr = new Ibkr(this.app);
  }

  public is_broker_authorised = (b: broker_t) => this[b].is_authorised();
  public wait_for_auth = (b: broker_t) => this[b].wait_for_auth();
  public get_saxo_code_url = () => this.saxo.get_code_url();
  public get_saxo_token = (code: string) => this.saxo.set_token(code);

  public init_brokers = () =>
    (this.brokers_ready_resolver = this.wait_for_brokers_authorised()
      .then(this.wait_for_fx_cache)
      .then(this.wait_for_accounts_cache)
      .then(this.wait_for_positions_cache)
      .then(() => (this.brokers_ready = true)));

  public wait_for_brokers() {
    return this.brokers_ready
      ? Promise.resolve(true)
      : this.brokers_ready_resolver || Promise.resolve(false);
  }

  private wait_for_brokers_authorised() {
    return Promise.all([
      this.saxo.wait_for_auth().then(() => console.info("Saxo is authorised")),
      this.ibkr.wait_for_auth().then(() => console.info("Ibkr is authorised")),
    ]);
  }

  private wait_for_accounts_cache = () =>
    Promise.all([
      this.saxo
        .cache_accounts()
        .then(() => console.info("Cached Saxo accounts")),
      this.ibkr
        .cache_accounts()
        .then(() => console.info("Cached Ibkr accounts")),
    ]);

  private wait_for_positions_cache = () =>
    Promise.all([
      this.saxo
        .cache_positions()
        .then(() => console.info("Cached Saxo positions")),
      this.ibkr
        .cache_positions()
        .then(() => console.info("Cached Ibkr positions")),
    ]);

  private wait_for_fx_cache = () =>
    this.ibkr.cache_fx().then(() => console.info("Cached FX rates"));

  public saxo: Saxo;
  public ibkr: Ibkr;
  public static currencies = currencies;
  public static base_currency = base_currency;

  private brokers_ready = false;
  private brokers_ready_resolver?: Promise<boolean>;
}
