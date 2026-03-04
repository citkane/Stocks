import { util } from "common";
import { Login } from "frontend/saxo";

import type { Saxo } from "frontend";

export class Authorise {
  constructor(private saxo: Saxo) {}

  public req_authorise = async () => {
    try {
      const authorised = await this.is_backend_authorised();
      if (authorised) return true;
      const login_url = await this.req_login_url();
      Login.popup_login(login_url);
      return new Promise<boolean>((resolve, reject) => {
        this.authorise_resolver = { resolve, reject };
      });
    } catch (err) {
      console.error(err);
      return false;
    }
  };
  public authorised = (success: boolean) => {
    if (success) {
      Login.popup_close();
      this.authorise_resolver.resolve(true);
    } else {
      Login.go_back();
      this.authorise_resolver.reject(false);
    }
  };

  private req_login_url = () => {
    return this.saxo.messenger
      .request<"backend", string>("saxo_auth_url")
      .then((mssg) => mssg.data);
  };

  private is_backend_authorised = () => {
    return this.saxo.messenger
      .request<"backend", boolean>("is_authorised", "saxo")
      .then((mssg) => mssg.data);
  };

  private authorise_resolver = util.blank_resolver();
}
