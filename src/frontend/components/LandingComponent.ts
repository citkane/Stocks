import { WebComponent } from "./WebComponent.ts";

export class LandingComponent extends WebComponent {
  constructor() {
    super();
  }
  public show = () => {
    if (this.hasAttribute("shown")) return;

    this._props.show();
    document.body.scrollTop = this.scroll_top;
  };
  public hide = () => {
    if (this.hasAttribute("hidden")) return;

    this.scroll_top = document.body.scrollTop;
    this._props.hide();
  };

  private _props = this.api.props({});
  private scroll_top = 0;
}
