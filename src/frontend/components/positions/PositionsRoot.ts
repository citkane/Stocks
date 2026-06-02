import { WebComponent } from "@frontend/components/WebComponent";
import type { PositionRow } from "@frontend/components";

export class PositionsRoot extends WebComponent {
  static observedAttributes = ["data-transctns", "data-filter"];

  constructor() {
    super();
    this.dom.template_to_self("position-root");
    this.dom.define_selectors();

    this.props.watch("data-transctns", this.handlers.render);
    this.props.watch("data-filter", this.handlers.filter);
  }

  private handlers = {
    render: (p: p.prop_callback) => {
      if (p.old === p.new) return;

      delete this._position;
      const transctns = this.money.positions.calculate_transctns(this.position);
      this.dom.position_rows(transctns);
      this.dom.define_selectors();
      this.props.refresh();
    },
    filter: (p: p.prop_callback) => {
      if (p.old === p.new) return;

      delete this._shown_position_elements;
      this.positn_row_els.forEach((row) => {
        row.setAttribute("data-filter", p.new);
      });
      this.props.refresh();
    },
  };

  private dom = this.api.dom({
    position_rows: (transactions: transctn_t[]) => {
      transactions
        .sort((a, b) => a.date - b.date)
        .forEach((transctn) => {
          const { id } = transctn;
          const ex_el = this.props.find_ex_positn(id);
          const positn_el = ex_el || this.props.make_positn_row(id);
          const data_transctn = util.html.json_stringify(transctn);
          positn_el.setAttribute("data-transaction", data_transctn);
          if (!ex_el) this.rows_wrapper_el.appendChild(positn_el);
        });
    },
    define_selectors: () => {
      this.positn_row_els = this.querySelectorAll<PositionRow>("position-row")
        .values()
        .toArray();
      this.rows_wrapper_el = this.querySelector<HTMLElement>(".wrapper.rows")!;
    },
  });

  private props = this.api.props({
    find_ex_positn: (id: string) => {
      return this.querySelector<PositionRow>(`position-row[id="${id}"]`);
    },
    make_positn_row: (id: string) => {
      return this.dom.make_el("position-row", "", `id="${id}"`);
    },
    refresh: () => {
      this.props.tally_money();
    },
    tally_money: () => {
      this.tally = this.money.instruments.tally(this.shown_positn_els);
    },
  });

  public get transctn_display_count() {
    return this.shown_positn_els.length;
  }

  private get shown_positn_els() {
    if (this._shown_position_elements) return this._shown_position_elements;

    let rows: PositionRow[] = [],
      div_rows: PositionRow[] = [];
    this.querySelectorAll<PositionRow>("position-row:not([hidden])")
      .values()
      .toArray()
      .forEach((row) => {
        const { kind } = row.transaction;
        if (kind === "dividend") {
          div_rows.push(row);
        } else {
          rows.push(row);
        }
      });
    if (!rows.length) return [];

    rows = [...rows, ...div_rows];
    return (this._shown_position_elements = rows);
  }

  private get transactions() {
    return this.cache.get.transactions(this.i_id);
  }
  private get position() {
    if (this._position) return this._position;
    return (this._position = this.money.positions.position(this.transactions));
  }

  public tally!: f.instrmnt_collector_t;
  private _position?: f.positn_t;
  private positn_row_els!: PositionRow[];
  private rows_wrapper_el!: HTMLElement;
  private _shown_position_elements?: PositionRow[];
}
