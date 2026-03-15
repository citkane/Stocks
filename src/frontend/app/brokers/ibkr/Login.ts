import { Global } from "@frontend/Global";
import { Brokers } from "@frontend/app/Brokers";

export class Login extends Global {
  constructor() {
    super();
    window.addEventListener("focus", () => Login.login_window?.focus());
  }
  public await_login = async () =>
    this.is_authorised().then((success) => {
      if (success) return;
      Login.popup_login(conf.ibkr.url.base);
      return this.await_auth().then(Login.popup_close);
    });

  public static popup_close = () => {
    this.login_window?.close();
    window.focus();
  };
  private await_auth = () =>
    this.ibkr.messenger.request<"backend">("wait_for_auth", "ibkr").then(() => {
      Login.popup_close();
      return true;
    });
  private is_authorised = () =>
    this.messenger
      .request<"backend", boolean>("is_authorised", "ibkr")
      .then((mssg) => mssg.data);

  private static popup_login = (url: string) => {
    this.login_window = Brokers.popup_login(url, "IBKR");
  };

  private static login_window?: ReturnType<typeof window.open>;
}
