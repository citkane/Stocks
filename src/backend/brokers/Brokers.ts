import { Global } from "backend";
import { CacheBrokers } from "./CacheBrokers";

export class Brokers extends Global {
  public init_brokers = () => {
    return Promise.all([this.ibkr.await_ready(), this.saxo.await_ready()]);
  };

  public update = {
    accounts: () => Promise.resolve(),
    //Promise.all([this.saxo.update.accounts(), this.ibkr.update.accounts()]),
    positions: () => this.saxo.update.positions(),
    //Promise.all([this.saxo.update.positions(), this.ibkr.update.positions()]),
  };

  public cache = new CacheBrokers();
}
