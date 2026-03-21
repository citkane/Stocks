import { Popup } from "@frontend/app/brokers/Popup";

export class Login extends Popup {
  constructor() {
    super("ibkr");
  }
  public await_login = async () => {
    const authorised = await this.req.authorised();
    return authorised
      ? null
      : this.popup.open(util.url.ibkr.login).then(this.req.await_auth);
  };
}
