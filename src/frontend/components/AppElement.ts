import { Select } from "@frontend/components";
import Cache from "@frontend/Cache";

//const info = {
//  exchange: "Exchange where dive position was purchased",
//  date: "Purchase date",
//  position: "Amount of stocks",
//  broker: "Broker where position resides",
//  traded_value: "Total cost at purchase in base currency",
//  market_value: "Current market value in base currency",
//  pl: "Unrealised total profit/loss over position lifetime in base currency",
//  fx_pl: "Profit/Loss as result of fx fluctuation in base currency",
//};

export class AppElement extends HTMLElement {
  constructor() {
    super();
  }

  public connectedCallback() {
    this.connected_callbacks.forEach((callback) => callback());
  }
  public disconnectedCallback() {
    this.disconnected_callbacks.forEach((callback) => callback());
  }
  public attributeChangedCallback(
    name: (typeof this.attribute_keys)[number],
    old_value: string,
    new_value: string,
  ) {
    try {
      const fnc = this.attribute_changed.get(name);
      if (!fnc) throw new Error(`Could not find function for ${name}`);
      fnc({ name, old: old_value, new: new_value });
    } catch (err) {
      logger.error(err);
    }
  }

  protected reset_filter = () => {
    AppElement.make_default_filter();
    this.apply_filter();
  };
  protected handle_filter = (
    ...props: [f.filter_keys_t, string | undefined][]
  ) => {
    props.forEach((prop) => {
      const [key, val] = prop;
      Cache._filter[key] = val;
    });
    this.apply_filter();
  };

  protected apply_filter = () => {
    const filter_string = AppElement.filter_string;
    this.root_instrmnts_el.setAttribute("data-filter", filter_string);
  };

  protected static filter_names: string[] = [];
  protected static get filter_string() {
    return util.html.json_stringify(Cache._filter);
  }
  protected static make_default_filter = () => {
    Cache._filter = this.filter_names.reduce((c, key) => {
      c[key as f.filter_keys_t] = "all";
      return c;
    }, {} as f.filter_t);
  };

  protected api = {
    connected_callback: (...callbacks: Array<() => void>) => {
      this.connected_callbacks = [...this.connected_callbacks, ...callbacks];
    },
    disconnected_callback: (...callbacks: Array<() => void>) => {
      this.disconnected_callbacks = [...this.connected_callbacks, ...callbacks];
    },
    dom: <T>(api: T) => {
      return { ...this.api_def.dom, ...api } as typeof this.api_def.dom & T;
    },
    props: <T>(api: T) => {
      return { ...this.api_def.props, ...api } as typeof this.api_def.props & T;
    },
    data: <T>(api: T) => {
      return { ...this.api_def.data, ...api } as typeof this.api_def.data & T;
    },
    extend: {
      dom: <T extends { [key: string]: Function }>(dom: T) => dom,
    },
  };
  private api_def = {
    props: {
      watch: (topic: string, fnc: watch_fnc_t) => {
        this.attribute_changed.set(topic, fnc);
      },

      //set_info: (el: Element, ..._p: any[]) => {
      //  const name = el.getAttribute("name") as keyof typeof info;
      //  if (!name || !info[name]) return;
      //  el?.setAttribute("info", info[name]);
      //},
      show: () => {
        this.setAttribute("shown", "");
        this.removeAttribute("hidden");
      },
      hide: () => {
        this.removeAttribute("shown");
        this.setAttribute("hidden", "");
      },
    },
    dom: {
      template_to_self: (id: string, deep = true) => {
        const template = document.getElementById(id)! as HTMLTemplateElement;
        template.classList.forEach((c) => this.classList.add(c));
        this.appendChild(document.importNode(template.content, deep));
      },

      make_el: <T extends HTMLElement>(
        kind: string,
        inner_html: string,
        ...properties: string[]
      ) => {
        return parse_html(
          `<${kind} ${properties.join(" ")}>${inner_html}</${kind}>`,
        ) as T;
      },
      named_el: (name: string) => {
        const child = this.querySelector(`*[name="${name}"]`);
        if (!child) throw Error(`No direct child named "${name}" found.`);
        return child;
      },
    },
    data: {
      money_totals: (rows: Element[]) => {
        const totals = rows.reduce((a, child) => {
          this.money.collect_keys.forEach((key) => {
            let val = Number(child.getAttribute(key));
            if (isNaN(val)) val = 0;
            a[key]! += val;
          });
          return a;
        }, this.money.collector());

        const { market_value, traded_value } = totals;
        const percent_pl = util.money.percent_pl(traded_value!, market_value!);
        totals.percent_pl = percent_pl;

        return totals;
      },
    },
  };
  protected money = {
    collector: () =>
      this.money.collect_keys.reduce(
        (c, key) => {
          return (c = { ...c, [key]: 0 });
        },
        {} as { [key: string]: number },
      ),
    collect_keys: [
      "traded_value",
      "market_value",
      "r_pl",
      "pl",
      "fx_pl",
      "dividend",
      "div_yield",
      "div_est",
    ],
  };

  protected get app() {
    return frontend.app;
  }
  protected get router() {
    return frontend.router;
  }
  protected get brokers() {
    return frontend.brokers;
  }
  protected get ws() {
    return frontend.ws;
  }
  protected get cache() {
    return frontend.cache;
  }
  protected get events() {
    return frontend.events;
  }
  protected get saxo() {
    return frontend.saxo;
  }
  protected get ibkr() {
    return frontend.ibkr;
  }
  protected get messenger() {
    return this.ws.messenger;
  }
  protected get select() {
    return Select;
  }

  protected get root_app_el() {
    return document.querySelector("app-root")!;
  }
  protected get root_instrmnts_el() {
    return this.root_app_el.querySelector("instrmnts-root")!;
  }
  protected get root_accounts_el() {
    return this.root_app_el.querySelector("accounts-root")!;
  }
  protected get select_account_el() {
    return this.root_app_el.querySelector("select-account")!;
  }
  protected get select_broker_el() {
    return this.root_instrmnts_el.querySelector("select-broker")!;
  }
  protected get select_sector_el() {
    return this.root_instrmnts_el.querySelector("select-sector")!;
  }
  protected get select_industry_el() {
    return this.root_instrmnts_el.querySelector("select-industry")!;
  }
  protected get filter_els() {
    return [
      ...this.root_instrmnts_el.querySelectorAll(
        ".filter.wrapper .inner > [filter]",
      ),
    ];
  }
  protected get displayed_instrmnt_els() {
    return [
      ...this.root_instrmnts_el.querySelectorAll("instrmnt-row:not([hidden])"),
    ];
  }

  protected get i_id() {
    return this.getAttribute("i_id") as i_id_t;
  }
  protected get filter() {
    return this.cache.filter;
  }
  private get attribute_keys() {
    return [...this.attribute_changed.keys()] as const;
  }

  private attribute_changed = new Map<string, watch_fnc_t>();
  private connected_callbacks = [] as Function[];
  private disconnected_callbacks = [] as Function[];
}

function parse_html(html: string) {
  const template = document.createElement("template");
  template.innerHTML = html.trim();
  const clone = document.importNode(template.content, true);
  return clone.firstChild!;
}

type watch_fnc_t = (prop: p.prop_callback) => void;
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
