import { CacheBroker } from "@backend/brokers";

export class Cache extends CacheBroker {
  public set market_view(views: Promise<Map<string, b.market_view_t>>) {
    views.then((view) => (this._market_view = view));
  }
  public get market_view() {
    return Promise.resolve(this._market_view);
  }

  public override get accounts() {
    return super.accounts.then((accounts) =>
      accounts.length
        ? accounts
        : this.db.select
            .accounts("ibkr")
            .then((accs) => accs.forEach(this.setter.account))
            .then(() => super.accounts),
    );
  }
  public override set accounts(accounts: Promise<account_t[]>) {
    super.accounts = accounts;
  }

  private _market_view = new Map<string, {}>() as Map<string, b.market_view_t>;
}
