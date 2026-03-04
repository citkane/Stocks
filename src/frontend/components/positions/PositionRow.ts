import { AppElement } from "@frontend/components/AppElement.ts";
import { type App, type Cache, Brokers } from "frontend";

export class PositionRow extends AppElement {
  constructor() {
    super();
    this.set_topic(this);

    this.app = window.app;
    this.cache = this.app.cache;
    this.position_id = this.getAttribute("id") || "";
    //this.removeAttribute("id")
    //this.setAttribute("display", "none")
  }
  connectedCallback() {
    this.render();
  }

  private render() {
    this.row_children.forEach((child) => this.appendChild(child));
    this.change_this_container("tr");
    //const tr = this.make_element("tr", this.row_html, `id=${this.id}`)
    //this.appendChild(tr);
  }
  private get position() {
    return this.cache.get.position(this.position_id);
  }
  private get row_children() {
    return Brokers.positions_headers.map((key) => {
      let value = this.position![key as keyof position_t].toString();
      return this.make_element("td", value, `name=${key}`);
    });
  }

  protected override app: App;
  protected override cache: Cache;
  position_id: string;
}
