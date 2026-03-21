import { CacheBroker, CacheBrokers } from "@backend/brokers";

export class Cache extends CacheBroker {
  public override get positions() {
    return super.positions.then((positions) =>
      positions.length
        ? positions
        : this.db.select
            .positions("ibkr")
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
            .accounts("ibkr")
            .then((accs) => accs.forEach(this.setter.account))
            .then(() => super.accounts),
    );
  }
  public override set accounts(accounts: Promise<account_t[]>) {
    super.accounts = accounts;
  }
  public get_transactions(conid: number) {
    return this._transactions.has(conid)
      ? Promise.resolve([...this._transactions.get(conid)!.values()])
      : this.db.select.ibkr_transactions(conid).then((trans) => {
          trans.forEach(this.set_transaction);
          return trans;
        });
  }
  public set transactions(trs: Promise<ibkr_t.transaction_t[]>) {
    trs.then((trs) =>
      this.db.insert.ibkr_transactions(trs).then(() => {
        trs.forEach(this.set_transaction);
      }),
    );
  }

  public override set fx_rates(rates: Promise<fx_rates_t>) {
    rates.then(async (rates) => {
      await this.db.insert.fx_rates(rates);
      CacheBrokers.fx_rates = Promise.resolve(rates);
    });
  }
  public override get fx_rates() {
    return super.fx_rates;
  }
  private set_transaction = (t: ibkr_t.transaction_t) => {
    const { conid } = t;
    if (!this._transactions.has(conid))
      this._transactions.set(conid, new Set());
    const transactions_set = this._transactions.get(conid)!;
    transactions_set.add(t);
  };

  private _transactions = new Map<number, Set<ibkr_t.transaction_t>>();
}
