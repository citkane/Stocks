import { WebComponent } from "@frontend/components/common/index";

const transition_sec = 1;

export class ExpandingDrawer extends WebComponent {
  static observedAttributes = ["state", "height"];

  constructor() {
    super();
    this.dom.template_to_self("expanding-drawer");
    this.props.watch("state", this.handlers.toggle);
    this.props.watch("height", this.handlers.height);

    this.style.height = "0";
    this.style.transition = `${transition_sec}s`;

    this.content.forEach((child) => this.inner.appendChild(child));
  }

  public toggle = () => {
    this.setAttribute("state", this.state === "open" ? "closed" : "open");
  };

  private handlers = {
    toggle: (p: p.prop_callback) => {
      if (p.old === p.new) return;

      if (p.new === "open") {
        this.handlers.height();
      } else {
        this.style.height = "0";
      }
    },
    height: () => {
      this.style.height = `${this.inner.scrollHeight}px`;
    },
  };
  private props = this.api.props({});
  private dom = this.api.dom({
    set_html_height: () => {
      setTimeout(() => {
        const height = `${this.scrollHeight}px`;
        this.style.height = height;
      });
    },
  });

  private get inner() {
    return this.querySelector(".inner")! as HTMLElement;
  }
  private get content() {
    return this.querySelectorAll("&> *:not(.inner)");
  }
  private get state() {
    return this.getAttribute("state")!;
  }
}
