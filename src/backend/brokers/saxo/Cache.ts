import { CacheBroker } from "@backend/brokers";

export class Cache extends CacheBroker {
  public get market_view() {
    return Promise.resolve(this._market_view);
  }
  public set market_view(view: Promise<b.market_view_map_t>) {
    view.then((view) => (this._market_view = view));
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

  private _market_view = new Map<string, {}>() as b.market_view_map_t;
}
