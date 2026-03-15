export class Cache {
  add = {
    position: (position: position_t) => {
      const { p_id } = position;
      this._positions.set(p_id, position);
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
    position: (p_id: string) => this._positions.get(p_id),
  };
  get accounts() {
    return [...this._accounts.values()];
  }
  get positions() {
    return [...this._positions.values()];
  }
  get stocks() {
    return [...this._stocks.values()];
  }
  private add_stock(position: position_t) {
    const { ticker, description, con_id, broker } = position;
    const stock: stock_t = this._stocks.get(ticker) || {
      con_id,
      broker,
      ticker,
      description,
      positions: new Set<position_t>(),
    };
    stock.positions.add(position);
    this._stocks.set(ticker, stock);
  }
  private _accounts = new Map<string, account_t>();
  private _positions = new Map<string, position_t>();
  private _stocks = new Map<string, stock_t>();
}
