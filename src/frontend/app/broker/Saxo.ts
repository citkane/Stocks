import { factory, type factory_t } from "./saxo/index.ts";
import { Init } from "../Init.ts";
import { Login } from "./saxo/Login";

export class Saxo extends Init {
  constructor() {
    super();
    const _factory = factory(this);
    this.auth = _factory.authorise;
    this.login = _factory.login;

    this.add_shutdown_task(Login.popup_close);
  }

  req_authorise = () => this.auth.req_authorise();
  authorised = (success: boolean) => this.auth.authorised.bind(this)(success);
  login_backend = () => this.login.login_backend();

  private auth: factory_t["authorise"];
  private login: factory_t["login"];
}
