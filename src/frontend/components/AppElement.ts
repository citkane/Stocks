import type { component_key_t } from "frontend";

type watch_fnc_t = (old_value: string, new_value: string) => void;

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

  attributeChangedCallback(
    name: (typeof this.attribute_keys)[number],
    old_value: string,
    new_value: string,
  ) {
    const fnc = this.attribute_changed.get(name);
    !!fnc
      ? fnc(old_value, new_value)
      : console.error(`Could not find function for ${name} on ${this.topic}`);
  }

  protected set_topic(_class: InstanceType<any>) {
    this.topic = _class.constructor.name;
  }

  protected api = {
    dom: <T>(api: T) => {
      return { ...this.api_def.dom, ...api } as typeof this.api_def.dom & T;
    },
    props: <T>(api: T) => {
      return { ...this.api_def.props, ...api } as typeof this.api_def.props & T;
    },
    data: <T>(api: T) => {
      return { ...this.api_def.data, ...api } as typeof this.api_def.data & T;
    },
  };

  protected get app() {
    return window.app;
  }
  protected get events() {
    return window.app.events;
  }
  protected get cache() {
    return window.app.cache;
  }
  protected get grid(): HTMLElement {
    return this.querySelector(".grid")!;
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
        const name = el?.getAttribute("name") as keyof typeof info;
        if (!name || !info[name])
          return console.warn(
            "Could not find info for element name property",
            el,
          );
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
      template_to_self: (template_id: string, deep = true) => {
        const template_content = get_template_content(template_id);
        this.appendChild(document.importNode(template_content, deep));
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

  private get attribute_keys() {
    return [...this.attribute_changed.keys()] as const;
  }

  protected topic?: component_key_t;
  private attribute_changed = new Map<string, watch_fnc_t>();
}

function get_template_content(id: string) {
  const template = document.getElementById(id)! as HTMLTemplateElement;
  return template.content;
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
