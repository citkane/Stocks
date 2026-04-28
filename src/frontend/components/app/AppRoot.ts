import { AppElement } from "@frontend/components/AppElement.ts";

export class AppRoot extends AppElement {
  static observedAttributes = ["transactions", "instruments", "accounts"];

  constructor() {
    super();
    this.api.set_topic(this);
    this.props.watch("transactions", this.handlers.transactions);
    this.props.watch("instruments", this.handlers.instruments);
    this.props.watch("accounts", this.handlers.accounts);

    //this.api.connected_callback(() => this.ready().then(this.render));
  }

  private handlers = {
    //wait_for_app_ready: (p: p.prop_callback) => {
    //  if (!!p.old) return this.ready_resolver?.reject(true);
    //  this.ready_resolver?.resolve(true);
    //},
    transactions: (p: p.prop_callback) => {
      if (p.new === p.old) return;
      this.transactions = p.new;
      if (!this.instruments || !this.accounts) return;
      this.render_instrmnts();
    },
    instruments: (p: p.prop_callback) => {
      if (p.new === p.old) return;
      this.instruments = p.new;
      if (!this.transactions || !this.accounts) return;
      this.render_instrmnts();
    },
    accounts: (p: p.prop_callback) => {
      if (p.new === p.old) return;
      this.root_accounts.setAttribute("accounts", p.new);
      this.accounts = p.new;
      if (!this.transactions || !this.instruments) return;
      this.render_instrmnts();
    },
  };

  //private ready = () => {
  //  return new Promise((resolve, reject) => {
  //    this.ready_resolver = { resolve, reject };
  //  });
  //};
  private render_instrmnts = () => {
    const instrmnt_data = {
      transactions: this.transactions,
      instruments: this.instruments,
      accounts: this.accounts,
    };
    this.root_instrmnts.setAttribute("data-all", util.hash_id(instrmnt_data));
  };

  private props = this.api.props({});
  //private ready_resolver?: resolver_t;
  private transactions?: string;
  private instruments?: string;
  private accounts?: string;
}
