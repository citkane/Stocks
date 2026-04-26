import { Select } from "@frontend/components";

type watch_fnc_t = (prop: p.prop_callback) => void;

//const money_value_keys = ["market_value", "traded_value", "pl", "fx_pl"];
const info = {
  exchange: "Exchange where dive position was purchased",
  date: "Purchase date",
  position: "Amount of stocks",
  broker: "Broker where position resides",
  traded_value: "Total cost at purchase in base currency",
  market_value: "Current market value in base currency",
  pl: "Unrealised total profit/loss over position lifetime in base currency",
  fx_pl: "Profit/Loss as result of fx fluctuation in base currency",
};

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
      if (!fnc)
        throw Error(`Could not find function for ${name} on ${this.topic}`);
      fnc({ name, old: old_value, new: new_value });
    } catch (err) {
      logger.error(err);
    }
  }

  protected api = {
    set_topic: (_class: InstanceType<any>) => {
      this.topic = _class.constructor.name;
    },
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

      set_info: (el: Element, ..._p: any[]) => {
        const name = el.getAttribute("name") as keyof typeof info;
        if (!name || !info[name]) return;
        el?.setAttribute("info", info[name]);
      },
      show: () => {
        this.style.display = "";
        this.setAttribute("display", "show");
      },
      hide: () => {
        this.style.display = "none";
        this.setAttribute("display", "none");
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
          this.money_keys.forEach((key) => {
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

  private money = {
    collector: () =>
      this.money_keys.reduce(
        (c, key) => {
          return (c = { ...c, [key]: 0 });
        },
        {} as { [key: string]: number },
      ),
  };

  protected get money_keys() {
    if (this._money_keys) return this._money_keys;
    const header = this.root_instrmnts.querySelector(".header_wrap .money");
    return [...header!.querySelectorAll("money-str")].map(
      (el) => el.getAttribute("name")!,
    );
  }
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
  protected get selectors() {
    return Select.selectors;
  }

  protected get grid() {
    return this.querySelector(".grid")!;
  }
  protected get root_app() {
    return document.querySelector("app-root")!;
  }
  protected get root_instrmnts() {
    return this.root_app.querySelector("instrmnts-root")!;
  }
  protected get root_accounts() {
    return this.root_app.querySelector("accounts-root")!;
  }
  protected get select_account() {
    return this.root_app.querySelector("select-account")!;
  }
  protected get select_broker() {
    return this.root_app.querySelector("select-broker")!;
  }
  protected get select_sector() {
    return this.root_app.querySelector("select-sector")!;
  }
  protected get select_industry() {
    return this.root_app.querySelector("select-industry")!;
  }

  private get attribute_keys() {
    return [...this.attribute_changed.keys()] as const;
  }

  protected topic?: component_key_t;
  private attribute_changed = new Map<string, watch_fnc_t>();
  private connected_callbacks = [] as Function[];
  private disconnected_callbacks = [] as Function[];
  private _money_keys?: string[];
}

function parse_html(html: string) {
  const template = document.createElement("template");
  template.innerHTML = html.trim();
  const clone = document.importNode(template.content, true);
  return clone.firstChild!;
}
