import { CacheBroker, CacheBrokers } from "@backend/brokers";

export class Cache extends CacheBroker {
  public override get positions() {
    if (!super.positions.length)
      this.db.select.positions("ibkr").forEach(this.setter.position);
    return super.positions;
  }
  public override set positions(positions: position_t[]) {
    super.positions = positions;
  }
  public override get accounts() {
    if (!super.accounts.length)
      this.db.select.accounts("ibkr").forEach(this.setter.account);
    return super.accounts;
  }
  public override set accounts(accounts: account_t[]) {
    super.accounts = accounts;
  }
  public transactions_for_con(conid: number) {
    if (!this._transactions.has(conid))
      this.db.select.ibkr_transactions(conid).forEach(this.set_transaction);
    const trans = this._transactions.get(conid)!;
    return [...trans.values()];
  }

  public set transactions(trs: ibkr_t.transaction_t[]) {
    this.db.insert.ibkr_transactions(trs);
    trs.forEach(this.set_transaction);
  }

  public override set fx_rates(rates: fx_rates_t) {
    CacheBrokers.fx_rates = rates;
  }
  private set_transaction = (t: ibkr_t.transaction_t) => {
    const { conid } = t;
    if (!this._transactions.has(conid))
      this._transactions.set(conid, new Set());
    const set = this._transactions.get(conid)!;
    set.add(t);
  };

  private _transactions = new Map<number, Set<ibkr_t.transaction_t>>();
}
