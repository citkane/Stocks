import { randomUUIDv7 } from "bun";
import { AuthBase } from "@backend/brokers/common";

const ping_auth_interval = 1190000;
const { app_key, app_secret, url } = conf.saxo;
const auth_string = btoa(`${app_key}:${app_secret}`);
const token_file = Bun.file(".temp/saxo.token.json");

class Oauth extends AuthBase {
  constructor(fetch_rate: number) {
    super("saxo", ping_auth_interval, fetch_rate);
  }

  public fetch_token = (code: string): Promise<boolean> => {
    const endpoint = this.endpoints.post.token(code, "authorization_code");
    return this.saxo
      .fetch<saxo_t.auth_token_t>(endpoint.url, endpoint.params)
      .then(this._token.store);
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
          params: this._token.params(code, grant_type),
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

  protected _token = {
    read: (): Promise<saxo_t.auth_token_t | false> =>
      token_file.json().catch(() => false),

    refresh: (refresh_token: string) => {
      const endpoint = this.endpoints.post.token(
        refresh_token,
        "refresh_token",
      );
      return this.saxo
        .fetch<saxo_t.auth_token_t>(endpoint.url, endpoint.params)
        .then(this._token.store)
        .catch((err) => this._token.remove(err).then(() => false));
    },

    params: (
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
    },
    store: (token: saxo_t.auth_token_t) => {
      this.token = token;
      return token_file.write(JSON.stringify(token)).then(() => true);
    },

    remove: (err: any) => {
      console.warn("Failed to refresh SAXO auth token", { err });
      return token_file.delete().catch(() => Promise.resolve());
    },
  };

  private get api_auth_url() {
    return util.url.saxo.auth;
  }
}

export class Authorise extends Oauth {
  constructor(fetch_rate: number) {
    super(fetch_rate);
  }
  public fetch_code_url = (): Promise<string> => {
    return this.saxo
      .fetch<Response>(this.endpoints.get.code_url())
      .then((res) => res.url);
  };
  public is_authorised = async () => {
    const token = await this._token.read();
    return !!token ? this._token.refresh(token.refresh_token) : false;
  };
}
