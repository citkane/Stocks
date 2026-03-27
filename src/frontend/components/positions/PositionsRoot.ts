import { AppElement } from "@frontend/components/AppElement.ts";

export class PositionsRoot extends AppElement {
  static observedAttributes = ["ticker", "drawer", "broker", "account"];

  constructor() {
    super();
    this.api.set_topic(this);
    this.dom.template_to_self("position-root");
    this.setAttribute("drawer", "closed");

    this.props.watch("ticker", this.handlers.render);
    this.props.watch("drawer", this.handlers.drawer);
    this.props.watch("broker", this.handlers.select);
    this.props.watch("account", this.handlers.select);
  }

  private handlers = {
    render: (p: p.prop_callback) => {
      if (p.old === p.new) return;

      let positions = this.cache.get.stock(this.ticker)?.positions;
      if (!positions) return;

      this.dom.append_position_rows(positions);
      this.data.refresh();
    },
    select: (p: p.prop_callback) => {
      if (p.old === p.new) return;

      this.position_rows.forEach((row) => row.setAttribute(p.name, p.new));
      this.data.refresh();

      this.displayed_position_count > 0 ? this.props.show() : this.props.hide();
    },
    drawer: (p: p.prop_callback) => {
      if (p.old === p.new) return;
      this.setAttribute("drawer", p.new);
    },
  };

  private data = this.api.data({
    refresh: () => {
      this.props.set_displayed_position_count();
      this.props.sum_values_to_props();
      this.dom.set_html_height();
    },
  });

  private dom = this.api.dom({
    append_position_rows: (p: Set<position_t>) => {
      p.forEach((p) => {
        const row = this.dom.make_element("position-row", "", `id=${p.p_id}`);
        this.grid.appendChild(row);
      });
    },
    set_html_height: () => {
      setTimeout(() => {
        const height = `${this.scrollHeight}px`;
        this.style.height = height;
      });
    },
  });

  private props = this.api.props({
    sum_values_to_props: () => {
      const values = this.data.money_totals(this.displayed_positions);
      Object.keys(values).forEach((key) =>
        this.setAttribute(key, values[key]!.toString()),
      );
    },
    set_displayed_position_count: () =>
      this.setAttribute(
        "position_count",
        this.displayed_positions.length.toString(),
      ),
  });

  private get ticker() {
    return this.getAttribute("ticker")!;
  }
  private get position_rows(): NodeListOf<HTMLElement> {
    return this.querySelectorAll("position-row")!;
  }
  private get displayed_positions() {
    return [...this.querySelectorAll("position-row:not([display=none])")];
  }
  private get displayed_position_count() {
    return Number(this.getAttribute("position_count")!);
  }
}
