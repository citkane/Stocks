import { Login } from "@frontend/app/brokers/Login";

export class Saxo extends Login {
  constructor() {
    super("saxo");
    this.add_shutdown_task(this.popup.close);
  }
  public await_login = async () => {
    return (await this.req.auth_state())
      ? null
      : this.req
          .url()
          .then(this.popup.open)
          .then(this.await_auth)
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
