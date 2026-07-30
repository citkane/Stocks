import type {
  InsightRoot,
  AccountsRoot,
  InstrumentsRoot,
  AppRoot,
  FilterRoot,
  MapRoot,
} from "@frontend/components";

export class WebComponent extends HTMLElement {
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
    dom: <T>(api = {} as T) => {
      return { ...this.api_def.dom, ...api } as typeof this.api_def.dom & T;
    },
    props: <T>(api = {} as T) => {
      return { ...this.api_def.props, ...api } as typeof this.api_def.props & T;
    },
    data: <T>(api = {} as T) => {
      return { ...this.api_def.data, ...api } as typeof this.api_def.data & T;
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
        this.setAttribute("hidden", "");
        this.removeAttribute("shown");
      },
    },
    dom: {
      template_to_self: (id: string, deep = true) => {
        const template = document.getElementById(id)! as HTMLTemplateElement;
        template.classList.forEach((c) => this.classList.add(c));
        this.appendChild(document.importNode(template.content, deep));
        this.init_els();
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
    },
    data: {},
  };
  protected get router() {
    return frontend.router;
  }
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
  protected get app() {
    return frontend.app;
  }
  public set_pid = (p_id: id.p, prefix: string) => {
    this.id_prefix = prefix;
    this.setAttribute("id", `${prefix}-${p_id}`);
  };
  protected get p_id() {
    if (this.id_p) return this.id_p;
    const p_id = this.getAttribute("id")?.replace(`${this.id_prefix}-`, "")!;
    return (this.id_p = p_id as id.p);
  }
  private get attribute_keys() {
    return [...this.attribute_changed.keys()] as const;
  }

  protected query = {
    select: <T>(
      selects = {} as { [key in keyof T]: ["qs" | "qsa", string] },
    ) => {
      const { els } = this;
      const entries = Object.entries(selects) as [
        string,
        ["qs" | "qsa", string],
      ][];
      entries.forEach(([key, q]) => {
        const selector = q[0] === "qs" ? els.qs : els.qsa;
        const cb_fn = () => ((this.els as any)[key] = selector(q[1]!)!);
        this.queries.push(cb_fn);
      });
      return this.els as typeof self.els & T;
    },
  };
  private queries = [] as Function[];
  private els = {
    qs: this.querySelector.bind(this),
    qsa: this.querySelectorAll.bind(this),
  };
  private init_els = () => {
    const { els } = self;

    els.root_instrmnts = els.root_instrmnts ??= els.qs("instrmnts-root")!;
    els.root_accounts = els.root_accounts ??= els.qs("accounts-root")!;
    els.root_insight = els.root_insight ??= els.qs("insight-root")!;
    els.root_app = els.root_app ??= els.qs("app-root")!;
    els.root_filter = els.root_filter ??= els.qs("filter-root")!;
    els.root_map = els.root_map ?? els.qs("map-root");

    this.queries.forEach((q) => q());
    Object.entries(self.els).forEach(([key, val]) => {
      (this.els as any)[key] = val;
    });
  };
  private static els = {
    qs: document.querySelector.bind(document),
    qsa: document.querySelectorAll.bind(document),
  } as {
    qs: typeof document.querySelector;
    qsa: typeof document.querySelectorAll;
    root_instrmnts: InstrumentsRoot;
    root_accounts: AccountsRoot;
    root_insight: InsightRoot;
    root_app: AppRoot;
    root_filter: FilterRoot;
    root_map: MapRoot;
  };

  private id_prefix = "";
  private id_p?: id.p;
  private attribute_changed = new Map<string, watch_fnc_t>();
  private connected_callbacks = [] as Function[];
  private disconnected_callbacks = [] as Function[];
}

const self = WebComponent;
function parse_html(html: string) {
  const template = document.createElement("template");
  template.innerHTML = html.trim();
  const clone = document.importNode(template.content, true);
  return clone.firstChild!;
}

type watch_fnc_t = (prop: pr.prop_callback) => void;
declare global {
  namespace filter {
    type totals = {
      div_val: number;
      div_est: number;
      pl_fx: number;
      pl_r: number;
      pl_ur: number;
      traded_value: number;
      market_value: number;
    };
  }
}
