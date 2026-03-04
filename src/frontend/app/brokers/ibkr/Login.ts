import { ibkr as conf } from "conf";
import { Brokers, type Ibkr } from "frontend";

export class Login {
  constructor(private ibkr: Ibkr) {
    window.addEventListener("focus", () => Login.login_window?.focus());
  }
  public await_login = async (): Promise<boolean> => {
    if (await this.is_authorised()) return Promise.resolve(true);
    return new Promise(async (resolve, _reject) => {
      Login.login_resolver = resolve;
      Login.popup_login(conf.url.base);
    });
  };

  public static got_login = () => {
    if (!this.login_resolver) return;
    window.focus();
    this.popup_close();
    this.login_resolver(true);
  };
  public static popup_close = () => {
    this.login_window?.close();
    window.focus();
  };

  private is_authorised = () => {
    return this.ibkr.messenger
      .request<"backend", boolean>("is_authorised", "ibkr")
      .then((mssg) => mssg.data);
  };

  private static popup_login = (url: string) => {
    this.login_window = Brokers.popup_login(url, "IBKR");
  };

  private static login_resolver?: resolve_t;
  private static login_window?: ReturnType<typeof window.open>;
}
