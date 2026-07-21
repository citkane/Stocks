import { LandingComponent } from "@frontend/components/LandingComponent";
import { type InsightView } from "@frontend/components";

export class InsightRoot extends LandingComponent {
  static observedAttributes = ["instrmnts", "positns"];

  constructor() {
    super();
    this.dom.template_to_self("insight-root");
    const { el, props, handlers } = this;
    el.view_buttns.forEach((b) => (b.onclick = handlers.change_view));
    el.sort_pl_ur.onclick = handlers.sort;
    el.sort_pl_ur_perc.onclick = handlers.sort;
    el.sort_value.onclick = handlers.sort;
    props.watch("instrmnts", handlers.render);
    props.watch("positns", handlers.positns);
  }

  private handlers = {
    render: (p: pr.prop_callback) => {
      if (p.old === p.new) return;

      const { el, active_view } = this;
      el.views.forEach((view, i) => {
        view.setAttribute("instrmnts", p.new);
        if (!active_view) return init(view, i);
        view.getAttribute("view") === active_view ? view.show() : view.hide();
      });
      function init(view: InsightView, i: number) {
        i > 0 ? view.hide() : view.show();
        if (i) return;
        const name = view.getAttribute("view")!;
        el.qs<HTMLButtonElement>(`.header button[name="${name}"]`)!.disabled =
          true;
      }
    },
    positns: (p: pr.prop_callback) => {
      if (p.old === p.new) return;
      this.el.views.forEach((view) => view.setAttribute("positns", p.new));
    },
    change_view: (e: Event) => {
      const target = e.target as HTMLButtonElement;
      const view_name = target.getAttribute("name")!;
      this.active_view = view_name;

      const { el } = this;
      el.view_buttns.forEach((button) => (button.disabled = false));
      target.disabled = true;
      el.views.forEach((view) =>
        view.getAttribute("view") === view_name ? view.show() : view.hide(),
      );
    },
    sort: (e: Event) => {
      const sort = (e.target as HTMLElement).getAttribute("name")!;
      this.el.views.forEach((view) => view.setAttribute("sort", sort));
    },
  };
  private props = this.api.props();
  private dom = this.api.dom();
  private el = this.query.select<{
    views: NodeListOf<InsightView>;
    view_buttns: NodeListOf<HTMLButtonElement>;
    content: HTMLElement;
    sort_value: HTMLElement;
    sort_pl_ur: HTMLElement;
    sort_pl_ur_perc: HTMLElement;
  }>({
    views: ["qsa", "insight-view"],
    view_buttns: ["qsa", ".header button"],
    content: ["qs", ".content"],
    sort_value: ["qs", '.header [name="market_value"]'],
    sort_pl_ur: ["qs", '.header [name="pl_ur"]'],
    sort_pl_ur_perc: ["qs", '.header [name="pl_ur_perc"]'],
  });

  private active_view?: string;
}

declare global {
  namespace insight {
    type view_name = "sectors" | "locations";
    type key<T extends view_name> = T extends "sectors"
      ? "asset_sector" | "asset_industry"
      : "country_qid" | "region_qid" | "place_qid";
  }
}
