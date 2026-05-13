import Cache from "@frontend/Cache";
import { Money } from "./Money";

export class Filter extends Money {
  constructor() {
    super();
  }

  protected filter = {
    handle: (...props: [f.filter_keys_t, string | undefined][]) => {
      props.forEach((prop) => {
        const [key, val] = prop;
        Cache._filter[key] = val;
      });
      this.apply_filter();
    },
    init: () => {
      const names = this.selector.filter.selects_names();
      Filter._filter_names = names;
      this.make_default_filter();
    },
  };
  protected get filter_str() {
    return Filter._filter_string;
  }

  private apply_filter = () => {
    const filter_string = Filter._filter_string;
    this.selector.root.instrmnts.setAttribute("data-filter", filter_string);
  };
  private make_default_filter = () => {
    Cache._filter = Filter._filter_names.reduce((c, key) => {
      c[key as f.filter_keys_t] = "all";
      return c;
    }, {} as f.filter_t);
  };

  private static _filter_names: string[] = [];
  private static get _filter_string() {
    return util.html.json_stringify(Cache._filter);
  }
}

declare global {
  namespace f {
    type filter_keys_t =
      | "broker"
      | "a_id"
      | "asset_sector"
      | "asset_industry"
      | "search";
    type filter_t = { [key in filter_keys_t]: string | undefined };
  }
}
