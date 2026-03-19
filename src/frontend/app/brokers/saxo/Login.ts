import { Brokers } from "@frontend/app/Brokers";

export class Login {
  constructor(private saxo: frontend.Saxo_t) {
    window.addEventListener("focus", () => Login.login_window?.focus());
  }

  public login_backend = () => {
    const { request } = this.saxo.messenger;
    const auth_code = this.parse_code_from_url();
    request<"backend">("saxo_fetch_token", auth_code)
      .then(() => request<"backend", boolean>("is_authorised", "saxo"))
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
