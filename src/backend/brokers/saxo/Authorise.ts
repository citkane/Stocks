import { randomUUIDv7 } from "bun";
import * as conf from "conf";
import type { Saxo } from "backend";
import { Oauth } from "backend/saxo";

let redirect: string;
let endpoint = "authorize";

export class Authorise {
  constructor(
    private saxo: Saxo,
    base_uri: string,
  ) {
    redirect = `${base_uri}${conf.saxo.url.redirect.code}`;
    endpoint = `${endpoint}?${this.make_code_params()}`;
  }

  public is_authorised = async (): Promise<boolean> => {
    try {
      const token = await Oauth.read_token();
      if (!token) return (Authorise.is_authorised = false);
      const is_valid = await this.saxo.oauth.refresh_token(token.refresh_token);
      return (Authorise.is_authorised = is_valid);
    } catch (err) {
      throw err;
    }
  };
  public wait_for_authorised = () => {
    return new Promise((resolve) => {
      if (Authorise.is_authorised) return resolve(true);
      const interval = setInterval(() => {
        if (Authorise.is_authorised) {
          clearInterval(interval);
          resolve(true);
        }
      }, 10);
    });
  };
  public get_code_url = (): Promise<string> => {
    const base_url = conf.saxo.url.auth;
    return this.saxo.fetch(endpoint, base_url).then((res) => res.url);
  };

  private make_code_params = () => {
    return [
      "response_type=code",
      `client_id=${conf.saxo.app_key}`,
      `state=${randomUUIDv7("base64url", Date.now())}`,
      `redirect_uri=${encodeURI(redirect)}`,
    ].join("&");
  };

  private static is_authorised = false;
}
