import { AppElement } from "@frontend/components/AppElement";

const selectors = ["broker", "a_id", "asset_sector", "asset_industry"] as const;

export class Select extends AppElement {
  constructor() {
    super();
    this.base_dom.template_to_self("select-widget");
  }

  protected base_dom = this.api.dom({
    add_option: (name: string, value = name, class_name = "") => {
      const option = this.base_dom.make_el(
        "option",
        name,
        `value="${value}"`,
        `class="${class_name}"`,
      );
      this.select_el.appendChild(option);
    },
    set_label: (name: string, label: string) => {
      this.select_el.setAttribute("name", name);
      this.label.setAttribute("for", name);
      this.label.innerHTML = label;
    },
  });

  public static apply_select = (prop: f.filter_t, value: string) => {
    this.global_filter[prop] = value;
    this.apply_filter();
  };
  public static reset_select = () => {
    this.global_filter = def_filter();
    this.apply_filter();
  };
  public static get selectors() {
    return selectors;
  }

  private static apply_filter = () => {
    this.instrumnts_root.setAttribute(
      "filter",
      util.html.json_stringify(this.global_filter),
    );
  };
  private static global_filter = def_filter();
  private static get instrumnts_root() {
    return document.querySelector("instrmnts-root")!;
  }

  protected set default_value(value: string) {
    this.select_el.value = value;
  }
  protected get label() {
    return this.querySelector("label")!;
  }
  protected get select_el() {
    return this.querySelector("select")!;
  }
}

function def_filter() {
  return selectors.reduce(
    (c, filter) => {
      c[filter] = "all";
      return c;
    },
    {} as { [key in f.filter_t]: string },
  );
}

declare global {
  namespace f {
    type filter_t = (typeof selectors)[number];
  }
}
