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

      const calculated_pos = this.data.calculate_position();
      const formatted_transcts = this.data.format_transctns(calculated_pos);
      this.dom.append_position_rows(formatted_transcts);

      this.props.refresh();
    },
    filter: (p: p.prop_callback) => {
      if (p.old === p.new) return;

      this.pos_rows.forEach((row) => row.setAttribute("filter", p.new));
      this.props.refresh();
    },
  };

  private data = this.api.data({
    calculate_position: () => {
      if (!this.position.sells.length) return this.position;

      const pos = structuredClone(this.position);
      pos.buys = pos.buys
        .sort((a, b) => a.price_traded! - b.price_traded!)
        .map((b) => {
          b.sales = b.amount;
          b.state = "open";
          return b;
        });
      pos.sells = pos.sells.map((s) => {
        s.sales = s.amount;
        s.r_pl = 0;
        return s;
      });

      let sell_total = pos.sells.reduce((c, sell) => {
        c += Math.abs(sell.amount);
        return c;
      }, 0);

      while (sell_total > 0) {
        pos.sells.forEach((sell) => {
          if (!sell.sales) return;
          const buy = pos.buys.find(
            (buy) => buy.sales! > 0 && buy.date < sell.date,
          )!;
          const sell_amount = Math.abs(sell.sales);
          const price_pl = sell.price_traded! - buy.price_traded!;
          if (buy.sales! === sell_amount) {
            buy.state = "closed";
            sell_total -= sell_amount;

            buy.sales = 0;
            sell.r_pl = price_pl * sell_amount;
            sell.sales = 0;
          } else if (buy.sales! > sell_amount) {
            sell_total -= sell_amount;

            buy.sales! -= sell_amount;
            sell.r_pl = price_pl * sell_amount;
            sell.sales = 0;
          } else {
            buy.state = "closed";
            sell_total -= buy.sales!;

            sell.r_pl! += price_pl * buy.sales!;
            sell.sales += buy.sales!;
            buy.sales = 0;
          }
        });
      }
      return pos;
    },
    format_transctns: (calculated_pos: f.positn_t) => {
      const pos = structuredClone(calculated_pos);

      const buys = pos.buys.map((b) => {
        b.meta = {};
        if (b.state === "closed") {
          b.meta.traded_value = util.money.base_money_whole(
            b.amount,
            b.price_traded,
            b.fx_traded,
          );
          b.sales = b.amount * -1;
          b.amount = 0;
          b.meta.amount = "closed";
          b.meta.pl = "-";
          b.meta.fx_pl = "-";
          b.meta.market_value = "-";

          return b;
        }

        if (b.sales) {
          b.meta.sales = b.sales - b.amount;
          if (!b.meta.sales) b.meta.sales = "-";
          b.amount = b.sales;
        }
        return b;
      });
      const sells = pos.sells.map((s) => {
        s.meta = {};
        s.sales = Math.abs(s.amount);
        s.meta.amount = "sell";
        s.meta.traded_value = util.money.base_money_whole(
          s.amount,
          s.price_traded,
          s.fx_traded,
        );
        s.r_pl = s.r_pl
          ? util.money.base_money_whole(1, s.r_pl, s.fx_traded)
          : 0;

        return s;
      });

      const dividends = pos.dividends.map((d) => {
        d.meta = {};
        d.meta.amount = "dividend";
        d.dividend = util.money.base_money_whole(
          d.amount,
          d.price_traded,
          d.fx_traded,
        );
        return d;
      });

      return [...buys, ...sells, ...dividends];
    },
  });

  private dom = this.api.dom({
    append_position_rows: (transactions: transctn_t[]) => {
      transactions
        .sort((a, b) => a.date - b.date)
        .forEach((transctn) => {
          const prop = util.string.json_prop("data-transaction", transctn);
          const row = this.dom.make_el("position-row", "", prop);
          this.grid.appendChild(row);
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
      const values = this.data.money_totals(this.displayed_pos_rows);
      Object.keys(values).forEach((key) => {
        this.setAttribute(key, values[key]!.toString());
      });
    },
    set_position_count: () =>
      this.setAttribute(
        "position_count",
        this.displayed_pos_rows.length.toString(),
      ),
  });

  private get transactions() {
    if (!!this._transctns) return this._transctns;
    delete this._position;
    const transactions = this.dataset.transctns!;
    return (this._transctns = util.html.json_parse<transctn_t[]>(transactions));
  }
  private get position() {
    if (this._position) return this._position;
    return (this._position = util.money.position(this.transactions));
  }
  private get displayed_pos_rows() {
    return [...this.querySelectorAll('position-row[display="show"]')!];
  }
  private get pos_rows() {
    return [...this.querySelectorAll("position-row")!];
  }

  private _transctns?: transctn_t[];
  private _position?: f.positn_t;
}
