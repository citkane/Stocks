import { CacheBroker } from "@backend/brokers";

export class Cache extends CacheBroker {
  public override get positions() {
    return super.positions.then((positions) =>
      positions.length
        ? positions
        : this.db.select
            .positions("saxo")
            .then((pos) => pos.forEach(this.setter.position))
            .then(() => super.positions),
    );
  }
  public override set positions(positions: Promise<position_t[]>) {
    super.positions = positions;
  }
  public override get accounts() {
    return super.accounts.then((accounts) =>
      accounts.length
        ? accounts
        : this.db.select
            .accounts("saxo")
            .then((accs) => accs.forEach(this.setter.account))
            .then(() => super.accounts),
    );
  }
  public override set accounts(accounts: Promise<account_t[]>) {
    super.accounts = accounts;
  }
}
