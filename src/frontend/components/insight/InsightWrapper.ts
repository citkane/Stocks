import { RootComponent } from "@frontend/components/RootComponent";
import type { InsightRoot } from "@frontend/components";

export class InsightWrapper extends RootComponent {
  static observedAttributes = ["instruments"];

  constructor() {
    super();
    this.dom.template_to_self("insight-wrapper");
    this.els_root.forEach((root) => {
      this.el_content.appendChild(root);
    });
    this.els_button.forEach(
      (button) => (button.onclick = this.handlers.toggle),
    );
    this.props.watch("instruments", this.handlers.render);
  }

  private handlers = {
    render: (p: p.prop_callback) => {
      if (p.old === p.new) return;

      this.els_root.forEach((root, i) => {
        root.setAttribute("instruments", this.instrmnt_hash);
        if (!this.state) {
          i > 0 ? root.hide() : root.show();
          if (i === 0) {
            const name = root.getAttribute("name")!;
            this.querySelector<HTMLButtonElement>(
              `.header button[name="${name}"]`,
            )!.disabled = true;
          }
          return;
        }
        this.els_root.forEach((root) => {
          root.getAttribute("name") === this.state ? root.show() : root.hide();
        });
      });
    },
    toggle: (e: Event) => {
      const target = e.target as HTMLButtonElement;
      this.els_button.forEach((button) => (button.disabled = false));
      target.disabled = true;
      const name = target.getAttribute("name")!;
      this.state = name;
      this.els_root.forEach((root) => root.hide());
      this.el_content
        .querySelector<InsightRoot>(`insight-root[name="${name}"]`)!
        .show();
    },
  };
  private props = this.api.props({});
  private dom = this.api.dom({});

  private get instrmnt_hash() {
    return this.getAttribute("instruments")!;
  }
  private get els_root() {
    return this.querySelectorAll<InsightRoot>("insight-root");
  }
  private get el_content() {
    return this.querySelector<HTMLElement>(".content")!;
  }
  private get els_button() {
    return this.querySelectorAll<HTMLButtonElement>(".header button");
  }

  private state?: string;
}
