import { Global } from "@backend/Global";
import * as lib from "@backend/brokers/ibkr/index";

export class BrokerIbkr extends Global {
  constructor() {
    super();
    this.api = new lib.IbkrApi();
    this.instruments = new lib.InstrumentsIbkr();
    this.transctns = new lib.TransactionsIbkr();
    this.live_data = new lib.LiveDataIbkr();
    this.accnts = new lib.AccountsIbkr();
    this.auth = new lib.AuthIbkr();
  }

  public update_accounts = () => this.update.accounts();
  public update_instruments = () => this.update.instruments();
  public update_transactions = () => this.update.transactions();
  public balances = async (fx: lv.forex[]) => this.accnts.balances(fx);
  public await_auth = () => this.auth.await_auth();
  public login = () => this.auth.login();
  public logout = () => this.auth.logout();
  public chart_data = (...p: pr.chart_period) => {
    return this.live_data.fetch_chart_data(...p);
  };
  public get auth_state() {
    return this.auth.state;
  }
  protected update = {
    accounts: async () => {
      const { accnts: accounts, db, bootstrap } = this;
      return accounts
        .update()
        .then(db.insert.accounts)
        .then(() => bootstrap("IBKR accounts updated"));
    },
    instruments: async () => {
      const { bootstrap, instruments, db } = this;
      return instruments
        .update()
        .then(db.insert.instrumnts)
        .then(() => bootstrap("IBKR instruments updated"));
    },
    transactions: async () => {
      const { db, bootstrap, transctns } = this;

      return transctns
        .last_update_date()
        .then(transctns.update)
        .then(db.insert.transctns.data)
        .then(() => bootstrap("IBKR transactions updated"));
    },
  };

  public auth: lib.AuthIbkr;
  public api: lib.IbkrApi;
  private instruments: lib.InstrumentsIbkr;
  private transctns: lib.TransactionsIbkr;
  private live_data: lib.LiveDataIbkr;
  private accnts: lib.AccountsIbkr;
}
