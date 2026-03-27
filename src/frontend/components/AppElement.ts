type watch_fnc_t = (prop: p.prop_callback) => void;

const money_value_keys = ["market_value", "buy_value", "pl", "fx_pl"];
const info = {
  exchange: "Exchange where dive position was purchased",
  date: "Purchase date",
  position: "Amount of stocks",
  broker: "Broker where position resides",
  buy_value: "Total cost at purchase in base currency",
  market_value: "Current market value in base currency",
  pl: "Unrealised total profit/loss over position lifetime in base currency",
  fx_pl: "Profit/Loss as result of fx fluctuation in base currency",
};

export class AppElement extends HTMLElement {
  constructor() {
    super();
  }
  connectedCallback() {
    this.connected_callbacks.forEach((callback) => callback());
  }
  disconnectedCallback() {
    this.disconnected_callbacks.forEach((callback) => callback());
  }
  attributeChangedCallback(
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
      console.error(err);
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

  protected get grid() {
    return this.querySelector(".grid")!;
  }
  private get app_root() {
    return document.querySelector("app-root")!;
  }
  private get stocks_root() {
    return this.app_root.querySelector("stocks-root")!;
  }
  private get account_selector() {
    return this.app_root.querySelector("select-account")!;
  }

  private get attribute_keys() {
    return [...this.attribute_changed.keys()] as const;
  }

  private api_def = {
    props: {
      watch: (topic: string, fnc: watch_fnc_t) => {
        this.attribute_changed.set(topic, fnc);
      },
      query_by_name: (name: string) => {
        const child = this.querySelector(`*[name="${name}"]`);
        if (!child) throw Error(`No direct child named "${name}" found.`);
        return child;
      },

      set_info: (el: Element, ..._p: any[]) => {
        const name = el.getAttribute("name") as keyof typeof info;
        if (!name || !info[name]) return;
        el?.setAttribute("info", info[name]);
      },
      show: () => {
        this.style.display = "";
        this.setAttribute("display", "");
      },
      hide: () => {
        this.style.display = "none";
        this.setAttribute("display", "none");
      },
    },
    dom: {
      stocks_root: this.stocks_root,
      account_selector: this.account_selector,
      template_to_self: (id: string, deep = true) => {
        const template = document.getElementById(id)! as HTMLTemplateElement;
        template.classList.forEach((c) => this.classList.add(c));
        this.appendChild(document.importNode(template.content, deep));
      },

      make_element: <T = HTMLElement>(
        kind: string,
        inner_html: string,
        ...properties: string[]
      ) =>
        parse_html(
          `<${kind} ${properties.join(" ")}>${inner_html}</${kind}>`,
        ) as T,
    },
    data: {
      money_totals: (rows: Element[]) => sum_values(rows),
    },
  };

  protected topic?: component_key_t;
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

function sum_values(children: Element[]) {
  return children.reduce((a, child) => {
    money_value_keys.forEach((key) => {
      a[key]! += Number(child.getAttribute(key));
    });
    return a;
  }, structuredClone(value_collector));
}

const value_collector = money_value_keys.reduce(
  (c, key) => {
    return (c = { ...c, [key]: 0 });
  },
  {} as { [key: string]: number },
);
