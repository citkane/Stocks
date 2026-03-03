import { factory, type factory_t } from "./ibkr/index.ts";
import { Init } from "../Init.ts";
import { Login } from "./ibkr/Login";

export class Ibkr extends Init {
  constructor() {
    super();
    const _factory = factory(this);
    this.login = _factory.login;

    this.add_shutdown_task(Login.popup_close);
  }

  await_login = () => this.login.await_login();
  authorised = (_success: boolean) => Login.got_login();

  protected login: factory_t["login"];
}
