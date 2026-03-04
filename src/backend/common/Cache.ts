import type { ibkr_t, saxo_t } from "types";
import { Account, Position, Transactions } from "backend";

type native_position_t = saxo_t.position_t | ibkr_t.position_t;
type native_account_t = saxo_t.account_t | ibkr_t.account_t;

export class Cache {
  get ibkr_accounts() {
    return this._ibkr_accounts.size
      ? [...this._ibkr_accounts.values()]
      : undefined;
  }
  get ibkr_account_ids() {
    if (!this._ibkr_accounts.size) {
      throw Error("cant fetch IBKR accounts from cache before setting");
    }
    return [...this._ibkr_accounts.keys()];
  }
  get ibkr_positions() {
    return this._ibkr_positions.size
      ? [...this._ibkr_positions.values()]
      : undefined;
  }
  get ibkr_transactions() {
    return this._ibkr_transactions.size
      ? [...this._ibkr_transactions.values()]
      : undefined;
  }
  get accounts() {
    const size = this._ibkr_accounts.size + this._saxo_accounts.size;
    return size
      ? [...this._ibkr_accounts.values(), ...this._saxo_accounts.values()]
      : [];
  }
  get positions() {
    const size = this._ibkr_positions.size + this._saxo_positions.size;
    return size
      ? [...this._ibkr_positions.values(), ...this._saxo_positions.values()]
      : [];
  }
  add = {
    account: (native_account: native_account_t, broker: broker_t) => {
      const account = new Account(native_account, broker).map();
      const { original_id } = account;
      if (account.broker === "saxo")
        this._saxo_accounts.set(original_id, account);
      if (account.broker === "ibkr")
        this._ibkr_accounts.set(original_id, account);
    },
    position: (native_position: native_position_t, broker: broker_t) => {
      const position = new Position(native_position, broker).map();
      const { original_id } = position;
      if (position.broker === "saxo")
        this._saxo_positions.set(original_id, position);
      if (position.broker === "ibkr")
        this._ibkr_positions.set(original_id, position);
    },
    accounts: (native_accounts: native_account_t[], broker: broker_t) => {
      native_accounts.forEach((account) => this.add.account(account, broker));
    },
    positions: (native_positions: native_position_t[], broker: broker_t) => {
      native_positions.forEach((native_position) =>
        this.add.position(native_position, broker),
      );
    },
    transactions: (transactions: ibkr_t.transaction_t[]) => {
      const { conid } = transactions[0]!;
      const transaction = new Transactions(transactions).map();
      this._ibkr_transactions.set(conid.toString(), transaction);
    },
  };
  private _saxo_accounts = new Map<string, account_t>();
  private _saxo_positions = new Map<string, position_t>();
  private _ibkr_accounts = new Map<string, account_t>();
  private _ibkr_positions = new Map<string, position_t>();
  private _ibkr_transactions = new Map<string, transaction_t>();
}
