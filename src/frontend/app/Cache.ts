export class Cache {
  add = {
    position: (position: position_t) => {
      const { id } = position;
      this._positions.set(id, position);
      this.add_stock(position);
    },
    account: (account: account_t) => {
      const { id } = account;
      this._accounts.set(id, account);
    },
  };
  get = {
    account: (id: string) => this._accounts.get(id),
    stock: (ticker: string) => this._stocks.get(ticker),
    position: (id: string) => this._positions.get(id),
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
    const { ticker, description } = position;
    const stock: stock_t = this._stocks.get(ticker) || {
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
