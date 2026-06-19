import { Global } from "@frontend/Global";

const width = 600;
const height = 900;
const windowFeatures = `popup,innerWidth=${width},innerHeight=${height}`;

export class Login extends Global {
  constructor(private broker: broker_t) {
    super();
    console.error(broker);

    window.addEventListener("focus", () => this.popup.focus());
  }
  public popup = {
    open: async (url: string) => {
      if (!this.is_url(url)) return console.error("No url for login popup");

      if (!!this.popup_window) return;
      const target = util.random_context();
      this.popup_window = window.open(url, target, windowFeatures);
      this.popup_window?.resizeTo(width, height);
    },
    close: async () => {
      this.popup_window?.close();
      delete this.popup_window;
      window.focus();
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
    auth_state: () => this.request<boolean>("auth_state", this.broker),
  };
  private is_url = (url: string) => {
    if (!url || url === null) return false;
    return url.startsWith("http://") || url.startsWith("https://");
  };
  private popup_window?: window_t;
}
