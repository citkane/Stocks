import { Login, factory, type factory_t } from "frontend/saxo";
import { Global } from "@frontend/Global";

export class Saxo extends Global {
  constructor() {
    super();
    const _factory = factory(this);
    this.auth = _factory.authorise;
    this.login = _factory.login;

    this.add_shutdown_task(Login.popup_close);
  }

  await_login = () => this.auth.await_login();
  //authorised = (success: boolean) => this.auth.authorised(success);
  login_backend = () => this.login.login_backend();

  private auth: factory_t["authorise"];
  private login: factory_t["login"];
}
