import type { saxo_t } from "../../../../types";
import { Brokers } from "../../Brokers";

import type { Saxo } from "..";

export class Login {
  constructor(private saxo: Saxo) {
    window.addEventListener("focus", () => Login.login_window?.focus());
  }

  public login_backend = () => {
    const auth_code = this.parse_code_from_url();
    this.saxo.messenger
      .request<"backend", boolean>("saxo_authorise", auth_code)
      .then((messg) => (messg.data ? Login.popup_close() : Login.go_back()))
      .catch(Login.go_back);
  };
  public static popup_login = (url: string) => {
    Login.login_window = Brokers.popup_login(url, "SAXO");
  };
  public static popup_close = () => {
    Login.login_window?.close();
    window.focus();
  };

  public static go_back = () => {
    Login.login_window?.history.back();
  };

  private parse_code_from_url = () => {
    const url = new URL(window.location.href);
    const params = Object.fromEntries(url.searchParams);
    return params as saxo_t.auth_code_t;
  };

  private static login_window: window_t;
}
