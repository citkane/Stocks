import { Saxo, Ibkr } from "./index.ts";

import type { App } from "..";

export class Brokers {
  constructor(private app: App) {
    this.saxo = new Saxo(this.app);
    this.ibkr = new Ibkr(this.app);
  }
  init() {
    this.data_ready_resolver = this.init_data();
  }
  is_data_ready() {
    return this.brokers_data_ready
      ? Promise.resolve(true)
      : this.data_ready_resolver || Promise.resolve(false);
  }
  is_broker_authorised = (broker: broker_t) => this[broker].is_authorised();
  get_saxo_code_url = () => this.saxo.get_code_url();
  get_saxo_token = (code: string) => this.saxo.set_token(code);

  private init_data = () =>
    this.are_brokers_authorised()
      .then(this.get_accounts)
      .then(this.get_positions)
      .then(() => {
        this.brokers_data_ready = true;
        return true;
      });

  private are_brokers_authorised() {
    return Promise.all([
      this.is_broker_authorised("ibkr"),
      this.is_broker_authorised("saxo"),
    ]);
  }

  private get_accounts = () =>
    Promise.all([this.saxo.get_accounts(), this.ibkr.accounts.get_accounts()]);

  private get_positions = () =>
    Promise.all([
      this.saxo.positions.get_positions(),
      this.ibkr.get_positions(),
    ]);

  private saxo: Saxo;
  private ibkr: Ibkr;

  private brokers_data_ready = false;
  private data_ready_resolver?: Promise<boolean>;
}
