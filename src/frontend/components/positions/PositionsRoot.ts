import { AppElement } from "@frontend/components/AppElement.ts";

export class PositionsRoot extends AppElement {
  static observedAttributes = ["ticker", "state", "broker"];

  constructor() {
    super();
    this.set_topic(this);
    this.dom.template_to_self("position-root");
    this.setAttribute("broker", "all");

    this.props.watch("ticker", this.handlers.render);
    this.props.watch("state", this.handlers.open_close);
    this.props.watch("broker", this.handlers.change_broker);
  }

  private handlers = {
    render: (old_value: string, new_value: string) => {
      if (old_value === new_value) return;

      let positions = this.cache.get.stock(this.ticker)?.positions!;

      this.dom.append_position_rows(positions);
      this.data.refresh();

      this.setAttribute("state", "closed");
    },
    change_broker: (old_value: string, new_value: string) => {
      if (old_value === new_value) return;

      this.position_rows.forEach((p) => p.setAttribute("broker", new_value));
      this.data.refresh();

      this.displayed_position_count > 0 ? this.props.show() : this.props.hide();
    },
    open_close: (old_value: string, new_value: string) => {
      if (old_value === new_value) return;
      this.setAttribute("state", new_value);
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
        const row = this.dom.make_element("position-row", "", `id=${p.id}`);
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
