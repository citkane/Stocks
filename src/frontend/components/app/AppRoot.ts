import { AppElement } from "@frontend/components/AppElement.ts";

export class AppRoot extends AppElement {
  static observedAttributes = ["transactions", "instruments"];

  constructor() {
    super();
    this.api.set_topic(this);
    this.props.watch("transactions", this.handlers.transactions);
    this.props.watch("instruments", this.handlers.instruments);

    //this.api.connected_callback(() => this.ready().then(this.render));
  }

  private handlers = {
    //wait_for_app_ready: (p: p.prop_callback) => {
    //  if (!!p.old) return this.ready_resolver?.reject(true);
    //  this.ready_resolver?.resolve(true);
    //},
    transactions: (p: p.prop_callback) => {
      if (p.new === p.old) return;
      this.transactions = util.html.json_parse(p.new);
      if (!this.instruments) return;
      this.render();
    },
    instruments: (p: p.prop_callback) => {
      if (p.new === p.old) return;
      this.instruments = util.html.json_parse(p.new);
      if (!this.transactions) return;
      this.render();
    },
  };

  //private ready = () => {
  //  return new Promise((resolve, reject) => {
  //    this.ready_resolver = { resolve, reject };
  //  });
  //};
  private render = () => {
    const data = {
      transactions: this.transactions,
      instruments: this.instruments,
    };
    this.root_instrmnts.setAttribute(
      "data-all",
      util.html.json_stringify(data),
    );
  };

  private props = this.api.props({});
  //private ready_resolver?: resolver_t;
  private transactions?: transctn_t[];
  private instruments?: instrmnt_t[];
}
