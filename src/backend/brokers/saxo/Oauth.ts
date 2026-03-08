import * as conf from "conf";
import type { Saxo } from "backend";
import type { saxo_t } from "types";

const endpoint = "token";
const token_file = `.temp/saxo.token.json`;
let redirect: string;

export class Oauth {
  constructor(
    private saxo: Saxo,
    base_uri: string,
  ) {
    redirect = `${base_uri}${conf.saxo.url.redirect.token}`;
  }
  public static read_token = async () => {
    const file = await Bun.file(token_file);
    if (!(await file.exists())) return false;
    return (await file.json()) as saxo_t.auth_token_t;
  };
  public set_token = (code: string): Promise<boolean> => {
    const url = conf.saxo.url.auth;
    const params = Oauth.make_token_params(code, "authorization_code");
    return this.saxo
      .fetch<saxo_t.auth_token_t>(endpoint, url, params)
      .then(this.save_token)
      .catch(() => false);
  };
  public refresh_token = (refresh_token: string) => {
    const url = conf.saxo.url.auth;
    const params = Oauth.make_token_params(refresh_token, "refresh_token");
    return this.saxo
      .fetch<saxo_t.auth_token_t>(endpoint, url, params)
      .then((token) => {
        Oauth.token = token;
        this.save_token(token);
        return true;
      })
      .catch(() => this.remove_token().then(() => false));
  };

  private save_token = (token: saxo_t.auth_token_t) => {
    return Bun.write(token_file, JSON.stringify(token)).then(() => true);
  };

  private remove_token = () => {
    const file = Bun.file(token_file);
    return file.exists().then(async (exists) => {
      if (exists) await file.delete();
    });
  };

  private static make_token_params = (
    code: string,
    grant_type: "authorization_code" | "refresh_token",
  ): RequestInit => {
    const auth_string = btoa(`${conf.saxo.app_key}:${conf.saxo.app_secret}`);
    const params = [
      `grant_type=${grant_type}`,
      `${grant_type === "authorization_code" ? "code" : "refresh_token"}=${code}`,
      `redirect_uri=${redirect}`,
    ].join("&");

    return {
      method: "POST",
      body: params,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${auth_string}`,
      },
    };
  };

  public static token = {
    access_token: "",
    refresh_token: "",
  } as saxo_t.auth_token_t;
}
