import { AppElement } from "@frontend/components/AppElement.ts";

export class PositionsRoot extends AppElement {
  static observedAttributes = ["data-transctns", "filter"];

  constructor() {
    super();
    this.api.set_topic(this);
    this.dom.template_to_self("position-root");

    this.props.watch("data-transctns", this.handlers.render);
    this.props.watch("filter", this.handlers.filter);
  }

  private handlers = {
    render: (p: p.prop_callback) => {
      if (p.old === p.new) return;

      delete this._position;
      const transctns = util.money.calculate_transctns(this.position);
      this.dom.position_rows(transctns);
      this.props.refresh();
    },
    filter: (p: p.prop_callback) => {
      if (p.old === p.new) return;

      this.positn_rows.forEach((row) => row.setAttribute("filter", p.new));
      this.props.refresh();
    },
  };

  private dom = this.api.dom({
    position_rows: (transactions: transctn_t[]) => {
      transactions
        .sort((a, b) => a.date - b.date)
        .forEach((transctn) => {
          const { id } = transctn;
          const ex_el = this.querySelector(`position-row[id="${id}"]`);
          const positn_el =
            ex_el || this.dom.make_el("position-row", "", `id="${id}"`);
          const data_transctn = util.html.json_stringify(transctn);
          positn_el.setAttribute("data-transaction", data_transctn);
          if (!ex_el) this.grid.appendChild(positn_el);
        });
    },
  });

  private props = this.api.props({
    refresh: () => {
      this.props.set_position_count();
      this.props.sum_values_to_props();
      //this.setAttribute("r_pl", String(this.realised_pl));
    },
    sum_values_to_props: () => {
      const values = this.data.money_totals(this.displayed_positn_rows);
      Object.keys(values).forEach((key) => {
        this.setAttribute(key, values[key]!.toString());
      });
    },
    set_position_count: () =>
      this.setAttribute(
        "position_count",
        this.displayed_positn_rows.length.toString(),
      ),
  });
  private data = this.api.data({});

  private get transactions() {
    return this.cache.get.transactions(this.i_id);
  }
  private get position() {
    if (this._position) return this._position;
    return (this._position = util.money.position(this.transactions));
  }
  private get displayed_positn_rows() {
    return [...this.querySelectorAll('position-row[display="show"]')!];
  }
  private get positn_rows() {
    return [...this.querySelectorAll("position-row")!];
  }

  //private _transctns?: transctn_t[];
  private _position?: f.positn_t;
}
