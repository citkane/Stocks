import { Login } from "frontend/ibkr";
import { Global } from "@frontend/Global";

export class Ibkr extends Global {
  constructor() {
    super();
    this.add_shutdown_task(this.login.popup.close);
  }
  await_login = () => this.login.await_login().then(this.login.popup.close);
  private login = new Login();
}
