import { Login } from "@frontend/app/brokers/Login";

export class LoginIbkr extends Login {
  constructor() {
    super("ibkr");
  }
  public await_login = async () => {
    const auth_state = await this.req.auth_state();
    return auth_state
      ? null
      : this.popup
          .open(conf.ibkr.base)
          .then(this.req.await_auth)
          .then(this.popup.close);
  };
}
