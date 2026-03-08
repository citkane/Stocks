import type { component_key_t } from "frontend";

type watch_fnc_t = (old_value: string, new_value: string) => void;
type mode_t = "open" | "closed";

export class AppElement extends HTMLElement {
  constructor() {
    super();
  }

  //protected template_to_shadow_root(
  //  template_id: string,
  //  mode: mode_t = "open",
  //  deep = true,
  //) {
  //  const template_content = this.get_template_content(template_id);
  //  this.attachShadow({ mode });
  //  this.shadowRoot?.appendChild(document.importNode(template_content, deep));
  //}
  protected get grid_headers() {
    const header_cells = this.querySelector(".row.header")?.children;
    return header_cells ? [...header_cells].map((c) => c.innerHTML) : [];
  }

  protected set_grid_columns() {
    this.style.gridTemplateColumns = `repeat(${this.grid_headers.length}, 1fr)`;
  }

  protected template_to_self(template_id: string, deep = true) {
    const template_content = this.get_template_content(template_id);
    this.appendChild(document.importNode(template_content, deep));
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

  protected query_by_name(name: string) {
    const child = this.querySelector(`*[name="${name}"]`);
    if (!child) throw Error(`No direct child named "${name}" found.`);
    return child;
  }

  protected watch = (topic: string, fnc: watch_fnc_t) => {
    this.attribute_changed.set(topic, fnc);
  };
  //protected change_this_container = (container_type: string) => {
  //  const container = document.createElement(container_type);
  //  for (const attr of this.attributes) {
  //    container.setAttribute(attr.name, attr.value);
  //  }
  //  container.innerHTML = this.innerHTML;
  //  this.replaceWith(container);
  //  return container;
  //};
  protected set_topic(_class: InstanceType<any>) {
    this.topic = _class.constructor.name;
  }
  private get_template_content(id: string) {
    const template = document.getElementById(id)! as HTMLTemplateElement;
    return template.content;
  }

  private parse_html(html: string) {
    const template = document.createElement("template");
    template.innerHTML = html.trim();
    const clone = document.importNode(template.content, true);
    return clone.firstChild! as HTMLElement;
  }

  private get attribute_keys() {
    return [...this.attribute_changed.keys()] as const;
  }

  protected get app() {
    return window.app;
  }
  protected get events() {
    return window.app.events;
  }
  protected get cache() {
    return window.app.cache;
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

  protected topic?: component_key_t;
  private attribute_changed = new Map<string, watch_fnc_t>();
}
