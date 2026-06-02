import { Login } from "@frontend/app/brokers/Login";

export class LoginSaxo extends Login {
  constructor() {
    super("saxo");
  }
  public await_login = async () => {
    const authorised = await this.req.auth_state();
    return authorised
      ? null
      : this.req
          .url()
          .then(this.popup.open)
          .then(this.req.await_auth)
          .then(this.popup.close);
  };
  public send_token_code = () => {
    const url = new URL(window.location.href);
    const code = Object.fromEntries(url.searchParams) as b.s.auth_code_t;
    document
      .querySelector("body")
      ?.setHTMLUnsafe('<pre id="login_succeeds">Client login succeeds</pre>');
    this.send("saxo_token", code);
  };
}
