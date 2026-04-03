type stock = stock_t<Set<transaction_t>>;

export class Cache {
  add = {
    transaction: (position: transaction_t) => {
      const { p_id } = position;
      this._transactions.set(p_id, position);
      this.add_stock(position);
    },
    account: (account: account_t) => {
      const { a_id } = account;
      this._accounts.set(a_id, account);
    },
  };
  get = {
    account: (a_id: string) => this._accounts.get(a_id),
    stock: (ticker: string) => this._stocks.get(ticker),
    transaction: (p_id: string) => this._transactions.get(p_id),
  };
  set accounts(accounts: account_t[]) {
    accounts.forEach(this.add.account);
  }
  get accounts() {
    return [...this._accounts.values()];
  }
  set transactions(transaction: transaction_t[]) {
    transaction.forEach(this.add.transaction);
  }
  get transactions() {
    return [...this._transactions.values()];
  }
  get stocks() {
    return [...this._stocks.values()];
  }
  private add_stock(transaction: transaction_t) {
    const { ticker, description, con_id, broker } = transaction;
    const stock: stock = this._stocks.get(ticker) || {
      con_id,
      broker,
      ticker,
      description,
      transactions: {
        buys: new Set<transaction_t>(),
        sells: new Set<transaction_t>(),
        dividends: new Set<transaction_t>(),
      },
    };
    stock.transactions[`${transaction.kind}s`].add(transaction);
    this._stocks.set(ticker, stock);
  }
  private _accounts = new Map<string, account_t>();
  private _transactions = new Map<string, transaction_t>();
  private _stocks = new Map<string, stock>();
}
