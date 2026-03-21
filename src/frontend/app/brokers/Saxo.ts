import { Login } from "frontend/saxo";
import { Global } from "@frontend/Global";

export class Saxo extends Global {
  constructor() {
    super();
    this.add_shutdown_task(this.login.popup.close);
  }
  await_login = () => this.login.await_login().then(this.login.popup.close);
  send_token_code = () => this.login.send_token_code();

  private login = new Login();
}
