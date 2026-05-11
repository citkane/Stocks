import { LoginIbkr } from "frontend/ibkr";
import { Global } from "@frontend/Global";

export class Ibkr extends Global {
  constructor() {
    super();
    this.add_shutdown_task(this.login.popup.close);
  }
  public await_login = () => this.login.await_login();

  private login = new LoginIbkr();
}
