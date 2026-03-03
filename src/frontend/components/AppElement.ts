import type { Events, Cache } from "../app";
import type { App } from "../App";
import type { component_key_t } from "../app/Events";

type watch_fnc_t = (old_value: string, new_value: string) => void;

export class AppElement extends HTMLElement {
  constructor() {
    super();
    this.attribute_changed.set("ready", this.watch_ready);
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
  protected watch = (topic: string, fnc: watch_fnc_t) => {
    this.attribute_changed.set(topic, fnc);
  };
  protected change_this_container = (container_type: string) => {
    const container = document.createElement(container_type);
    for (const attr of this.attributes) {
      container.setAttribute(attr.name, attr.value);
    }
    container.innerHTML = this.innerHTML;
    this.replaceWith(container);
    return container;
  };

  protected get table() {
    if (!this._table) {
      const template = document.querySelector("#table") as HTMLTemplateElement;
      const clone = document.importNode(template.content, true);
      this._table = clone.querySelector("table")!;
    }
    return this._table;
  }
  protected get thead() {
    if (!this._thead) this._thead = this.table.querySelector("thead")!;
    return this._thead;
  }
  protected get tbody() {
    if (!this._tbody) this._tbody = this.table.querySelector("tbody")!;
    return this._tbody;
  }
  protected make_element = (
    kind: string,
    inner_html: string,
    ...properties: string[]
  ) => {
    return this.parse_html(
      `<${kind} ${properties.join(" ")}>${inner_html}</${kind}>`,
    );
  };

  protected set_topic(_class: InstanceType<any>) {
    this.topic = _class.constructor.name;
  }

  protected ready() {
    return new Promise((resolve, reject) => {
      this.ready_resolver = { resolve, reject };
    });
  }

  private parse_html(html: string) {
    const template = document.createElement("template");
    template.innerHTML = html.trim();
    const clone = document.importNode(template.content, true);
    return clone.firstChild!;
  }
  private watch_ready = (old_value: string) => {
    if (!!old_value) return this.ready_resolver?.reject(true);
    this.app = window.app;
    this.events = this.app.events;
    this.cache = this.app.cache;
    this.ready_resolver?.resolve(true);
  };

  private get attribute_keys() {
    return [...this.attribute_changed.keys()] as const;
  }

  protected app!: App;
  protected events!: Events;
  protected cache!: Cache;
  protected topic?: component_key_t;

  private attribute_changed = new Map<string, watch_fnc_t>();
  private ready_resolver?: resolver_t;

  private _table!: HTMLElement;
  private _thead!: HTMLElement;
  private _tbody!: HTMLElement;
}
