import { randomUUIDv7 } from "bun";
import { AuthBase } from "@backend/brokers/common";

const ping_auth_interval = 1190000;
const { app_key, app_secret, url } = conf.saxo;
const auth_string = btoa(`${app_key}:${app_secret}`);
const token_file = `.temp/saxo.token.json`;

class Oauth extends AuthBase {
  constructor() {
    super("saxo", ping_auth_interval);
  }

  public fetch_token = (code: string): Promise<boolean> => {
    const endpoint = this.endpoints.post.token(code, "authorization_code");
    return this.saxo
      .fetch<saxo_t.auth_token_t>(endpoint.url, endpoint.params)
      .then(this.store_token);
  };
  public token = {
    access_token: "",
    refresh_token: "",
  } as saxo_t.auth_token_t;

  protected endpoints = {
    post: {
      token: (
        code: string,
        grant_type: "authorization_code" | "refresh_token",
      ) => {
        return {
          url: `${this.api_auth_url}/token`,
          params: this.post_token_params(code, grant_type),
        };
      },
    },
    get: {
      code_url: () => {
        const redirect = encodeURI(`${this.http.url}${url.redirect.code}`);
        const params = [
          "response_type=code",
          `client_id=${app_key}`,
          `state=${randomUUIDv7("base64url", Date.now())}`,
          `redirect_uri=${redirect}`,
        ].join("&");

        return `${this.api_auth_url}/authorize?${params}`;
      },
    },
  };
  private get api_auth_url() {
    return util.url.saxo.auth;
  }

  protected read_token = (): Promise<saxo_t.auth_token_t | false> =>
    this.file.exists().then((exists) => (exists ? this.file.json() : false));

  protected refresh_token = (refresh_token: string) => {
    const endpoint = this.endpoints.post.token(refresh_token, "refresh_token");
    return this.saxo
      .fetch<saxo_t.auth_token_t>(endpoint.url, endpoint.params)
      .then(this.store_token)
      .catch((err) => this.remove_token(err).then(() => false));
  };

  private post_token_params = (
    code: string,
    grant_type: "authorization_code" | "refresh_token",
  ): RequestInit => {
    const redirect_uri = `${this.http.url}${url.redirect.token}`;
    const code_key =
      grant_type === "authorization_code" ? "code" : "refresh_token";
    const params = [
      `grant_type=${grant_type}`,
      `${code_key}=${code}`,
      `redirect_uri=${redirect_uri}`,
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
  private store_token = (token: saxo_t.auth_token_t) => {
    this.token = token;
    return Bun.write(token_file, JSON.stringify(token)).then(() => true);
  };

  private remove_token = (err: any) => {
    console.error("Failed to refresh SAXO auth token", { err });
    return this.file
      .exists()
      .then((exists) => (exists ? this.file.delete() : Promise.resolve()));
  };
  private file = Bun.file(token_file);
}

export class Authorise extends Oauth {
  public fetch_code_url = (): Promise<string> => {
    return this.saxo
      .fetch(this.endpoints.get.code_url())
      .then((res) => res.url);
  };
  public is_authorised = () =>
    this.read_token().then((token) =>
      !token
        ? false
        : this.refresh_token(token.refresh_token).then(
            (success) => (this.authorised = success),
          ),
    );

  public authorised = false;
}
