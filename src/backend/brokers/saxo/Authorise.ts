import { randomUUIDv7 } from "bun";
import * as conf from "conf";
import { poll_for_auth, wait_for_auth } from "backend";
import { Oauth } from "backend/saxo";

import type { Saxo } from "backend";

const keepalive_interval = 1190000;

//let redirect: string;
//let endpoint = "authorize";

export class Authorise {
  constructor(
    private saxo: Saxo,
    base_uri: string,
  ) {
    this.redirect = `${base_uri}${conf.saxo.url.redirect.code}`;
    this.endpoint = `authorize?${this.make_code_params()}`;
    this.poll_for_auth();
  }
  public wait_for_auth = () => wait_for_auth.bind(this, Authorise)();
  private poll_for_auth = () => poll_for_auth.bind(this, Authorise)();

  public is_authorised = async (): Promise<boolean> =>
    Oauth.read_token().then((token) => {
      if (!token) return (Authorise.is_authorised = false);
      return this.saxo.oauth
        .refresh_token(token.refresh_token)
        .then((success) => (Authorise.is_authorised = success));
    });

  public get_code_url = (): Promise<string> => {
    const base_url = conf.saxo.url.auth;
    return this.saxo.fetch(this.endpoint, base_url).then((res) => res.url);
  };

  private make_code_params = () => {
    return [
      "response_type=code",
      `client_id=${conf.saxo.app_key}`,
      `state=${randomUUIDv7("base64url", Date.now())}`,
      `redirect_uri=${encodeURI(this.redirect)}`,
    ].join("&");
  };

  public static is_authorised = false;
  public static keepalive_interval = keepalive_interval;

  private redirect: string;
  private endpoint: string;
}
