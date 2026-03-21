import { Popup } from "@frontend/app/brokers/Popup";

export class Login extends Popup {
  constructor() {
    super("saxo");
  }
  public await_login = async () => {
    const authorised = await this.req.authorised();
    return authorised
      ? null
      : this.req.url().then(this.popup.open).then(this.req.await_auth);
  };
  public send_token_code = () => {
    const url = new URL(window.location.href);
    const code = Object.fromEntries(url.searchParams) as saxo_t.auth_code_t;
    this.send("saxo_make_token", code);
  };
}
