import { Filter } from "./Filter";

export class WebComponent extends Filter {
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
    data: {},
  };

  protected get brokers() {
    return frontend.brokers;
  }
  protected get ws() {
    return frontend.ws;
  }
  protected get messenger() {
    return this.ws.messenger;
  }
  protected get cache() {
    return frontend.cache;
  }
  protected get i_id() {
    return this.getAttribute("i_id") as i_id_t;
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
