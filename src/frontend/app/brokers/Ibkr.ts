import { Login } from "@frontend/app/brokers/Login";

export class Ibkr extends Login {
  constructor() {
    super("ibkr");
    this.add_shutdown_task(this.popup.close);
  }
  public await_login = async () => {
    return (await this.req.auth_state())
      ? null
      : this.popup
          .open(conf.ibkr.base)
          .then(this.await_auth)
          .then(this.popup.close);
  };
}
