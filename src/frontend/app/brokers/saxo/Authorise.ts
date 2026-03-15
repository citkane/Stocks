import { Login } from "frontend/saxo";
import { Global } from "@frontend/Global";

export class Authorise extends Global {
  public await_login = () =>
    this.is_backend_authorised().then((success) => {
      if (success) return;
      return this.req_login_url()
        .then(Login.popup_login)
        .then(this.await_auth)
        .then(Login.popup_close);
    });

  private await_auth = () => {
    return this.messenger
      .request<"backend", boolean>("wait_for_auth", "saxo")
      .then((mssg) => mssg.data);
  };

  private req_login_url = () => {
    return this.messenger
      .request<"backend", string>("saxo_auth_url")
      .then((mssg) => mssg.data);
  };

  private is_backend_authorised = () =>
    this.messenger
      .request<"backend", boolean>("is_authorised", "saxo")
      .then((mssg) => mssg.data);
}
