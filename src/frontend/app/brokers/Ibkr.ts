import { Login, factory, type factory_t } from "frontend/ibkr";
import { Init } from "@frontend/app/Init";

export class Ibkr extends Init {
  constructor() {
    super();
    const _factory = factory(this);
    this.login = _factory.login;

    this.add_shutdown_task(Login.popup_close);
  }

  await_login = () => this.login.await_login();
  //authorised = (_success: boolean) => Login.got_login();

  protected login: factory_t["login"];
}
