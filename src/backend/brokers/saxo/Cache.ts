import { CacheBroker } from "@backend/brokers";

export class Cache extends CacheBroker {
  public override get positions() {
    if (!super.positions.length)
      this.db.select.positions("saxo").forEach(this.setter.position);
    return super.positions;
  }
  public override set positions(positions: position_t[]) {
    super.positions = positions;
  }
  public override get accounts() {
    if (!super.accounts.length)
      this.db.select.accounts("saxo").forEach(this.setter.account);
    return super.accounts;
  }
  public override set accounts(accounts: account_t[]) {
    super.accounts = accounts;
  }
}
