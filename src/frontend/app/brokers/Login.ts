import { Global } from "@frontend/Global";

const width = 600;
const height = 900;
const windowFeatures = `popup,innerWidth=${width},innerHeight=${height}`;

export class Login extends Global {
  constructor(private broker: g.broker) {
    super();
    window.addEventListener("focus", () => this.popup.focus());
  }
  protected await_auth = async () => {
    const { req } = this;
    if (await req.auth_state()) return;
    return new Promise<void>((resolve) => poll(resolve));

    function poll(resolve: g.resolve) {
      const poll = setInterval(async () => {
        if (!(await req.auth_state())) return;
        clearInterval(poll);
        resolve();
      }, 500);
    }
  };
  protected popup = {
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
    //await_auth: () => this.request<null>("wait_for_auth", this.broker),
    url: () => this.request<string>("saxo_auth_url"),
    auth_state: () => this.request<boolean>("auth_state", this.broker),
  };
  private is_url = (url: string) => {
    if (!url || url === null) return false;
    return url.startsWith("http://") || url.startsWith("https://");
  };
  private popup_window?: window_t;
}
