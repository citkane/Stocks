import { WebComponent } from "@frontend/components/WebComponent";
import { AnyString, DateString, MoneyString } from "@frontend/components";

export class TransctnRow extends WebComponent {
  static observedAttributes = ["transctn"];

  constructor() {
    super();
    this.dom.template_to_self("transctn-row");
    this.props.watch("transctn", this.handlers.render);
    this.props.show();
  }
  public filter = (hide: boolean, broker?: string, a_id?: string) => {
    if (hide) return this.props.hide();

    const { transaction: t } = this;
    hide = (!!broker && t.broker !== broker) || (!!a_id && t.a_id !== a_id);
    hide ? this.props.hide() : this.props.show();
  };
  private handlers = {
    render: (p: pr.prop_callback) => {
      if (p.old === p.new) return;

      const { el, transaction: t } = this;
      if (t.market_value) el.market_value.money_value = t.market_value;
      if (t.traded_value) el.traded_value.money_value = t.traded_value;
      if (t.div_value) el.div_val.money_value = t.div_value;
      if (t.pl_ur) el.pl_ur.money_value = t.pl_ur;
      if (t.pl_fx) el.pl_fx.money_value = t.pl_fx;
      if (t.pl_r) el.pl_r.money_value = t.pl_r;

      const meta_div = !t.div_value && String(t.meta.div_value);
      const meta_amount = t.meta.amount ? Number(t.meta.amount) : undefined;
      el.sales.value = meta_div || 0;
      el.amount.value = meta_amount || t.amount;
      el.kind.value = t.kind;
      el.date.value = t.date;
      el.broker.value = t.broker;
    },
  };

  private el = this.query.select<{
    date: DateString;
    broker: AnyString;
    sales: AnyString;
    kind: AnyString;
    amount: AnyString;
    market_value: MoneyString;
    traded_value: MoneyString;
    pl_r: MoneyString;
    pl_ur: MoneyString;
    pl_fx: MoneyString;
    div_val: MoneyString;
  }>({
    date: ["qs", `[name="date"]`],
    broker: ["qs", `[name="broker"]`],
    sales: ["qs", `[name="sales"]`],
    kind: ["qs", `[name="kind"]`],
    amount: ["qs", `[name="amount"]`],
    market_value: ["qs", `[name="market_value"]`],
    traded_value: ["qs", `[name="traded_value"]`],
    pl_r: ["qs", `[name="pl_r"]`],
    pl_ur: ["qs", `[name="pl_ur"]`],
    pl_fx: ["qs", `[name="pl_fx"]`],
    div_val: ["qs", `[name="div_val"]`],
  });

  private dom = this.api.dom();
  private props = this.api.props();

  public get transaction() {
    const id = this.getAttribute("id");
    return this.cache.get.transctns()[id!]!;
  }
}
