import { default as ibkr_accounts } from "./data/IBKR_accounts.json";
import { default as ibkr_positions } from "./data/IBKR_positions.json";
import { default as ibkr_transactions } from "./data/IBKR_transactions.json";
import { default as saxo_accounts } from "./data/SAXO_accounts.json";
import { default as saxo_positions } from "./data/SAXO_positions.json";

export const data = {
  ibkr: {
    accounts: ibkr_accounts! as ibkr_t.account_t[],
    positions: ibkr_positions! as ibkr_t.position_t[],
    transactions: ibkr_transactions! as ibkr_t.transaction_t[][],
  },
  saxo: {
    accounts: saxo_accounts!,
    positions: saxo_positions!,
  },
};
