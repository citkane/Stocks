import { WebComponent } from "@frontend/components/WebComponent";
import type { TransctnRow } from "@frontend/components";

export class PositnsRoot extends WebComponent {
  static observedAttributes = ["positn"];

  constructor() {
    super();
    this.dom.template_to_self("position-root");
    this.props.watch("positn", this.handlers.render);
  }

  public filter = (
    hide: boolean,
    broker: string | undefined,
    a_id: string | undefined,
  ) => {
    const rows = Object.values(this.transctn_rows);
    rows.forEach((row) => {
      row.filter(hide, broker, a_id);
    });

    return this.transctn_ids;
  };

  private handlers = {
    render: (p: pr.prop_callback) => {
      if (p.old === p.new) return;

      const { el, dom, transctns, transctn_rows } = this;
      transctns.sort((a, b) => a.date - b.date).forEach(make);

      function make(transctn: pos.transctn) {
        const { id } = transctn,
          ex_row = transctn_rows[id],
          row = ex_row || dom.make_transctn_row(id),
          transctn_hash = util.hash_id(transctn);

        row.setAttribute("transctn", transctn_hash);
        if (!ex_row) el.wrapper.appendChild(row);
      }
    },
  };
  private props = this.api.props();
  private dom = this.api.dom({
    make_transctn_row: (id: string) => {
      const { dom, transctn_rows } = this;
      const row = dom.make_el<TransctnRow>("transctn-row", "", `id="${id}"`);
      transctn_rows[id] = row;
      return row;
    },
  });

  public get transctn_ids() {
    return Object.values(this.transctn_rows)
      .filter((r) => r.hasAttribute("shown"))
      .map((r) => r.id);
  }
  private get transctns() {
    return this.positn.transctns;
  }
  private get positn() {
    return this.cache.get.positns()[this.p_id]!;
  }
  private el = this.query.select<{
    div_yield: HTMLElement;
    wrapper: HTMLElement;
  }>({
    div_yield: ["qs", '[name="div_yield"]'],
    wrapper: ["qs", ".wrapper.rows"],
  });
  private transctn_rows = {} as { [id: string]: TransctnRow };
}
