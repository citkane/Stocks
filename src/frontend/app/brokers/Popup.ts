import { Global } from "@frontend/Global";

const width = 600;
const height = 900;
const windowFeatures = `popup,innerWidth=${width},innerHeight=${height}`;

export class Popup extends Global {
  constructor(private broker: broker_t) {
    super();
    window.addEventListener("focus", () => this.popup.focus());
  }
  public popup = {
    open: (url: string) => {
      this.popup_window = window.open(url, this.broker, windowFeatures);
      this.popup_window?.resizeTo(width, height);
      return Promise.resolve();
    },
    close: () => {
      window.focus();
      this.popup_window?.close();
    },
    back: () => {
      this.popup_window?.history.back();
    },
    focus: () => {
      this.popup_window?.focus();
    },
  };
  protected req = {
    await_auth: () => this.request<null>("wait_for_auth", this.broker),
    url: () => this.request<string>("saxo_auth_url"),
    authorised: () => this.request<boolean>("is_authorised", this.broker),
  };
  private popup_window?: window_t;
}
