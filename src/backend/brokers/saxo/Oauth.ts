import { Global } from "backend";

const endpoint = "token";
const url = conf.saxo.url.auth;
const token_file = `.temp/saxo.token.json`;

export class Oauth extends Global {
  public read_token = async () => {
    const file = await Bun.file(token_file);
    if (!(await file.exists())) return false;
    return (await file.json()) as saxo_t.auth_token_t;
  };
  public set_token = (code: string): Promise<boolean> => {
    const params = this.make_token_params(code, "authorization_code");
    return this.saxo
      .fetch<saxo_t.auth_token_t>(endpoint, url, params)
      .then(this.save_token)
      .catch(() => false);
  };
  public refresh_token = (refresh_token: string) => {
    const params = this.make_token_params(refresh_token, "refresh_token");
    return this.saxo
      .fetch<saxo_t.auth_token_t>(endpoint, url, params)
      .then((token) => {
        this.token = token;
        return this.save_token(token);
      })
      .catch(() => this.remove_token().then(() => false));
  };

  private save_token = (token: saxo_t.auth_token_t) => {
    return Bun.write(token_file, JSON.stringify(token)).then(() => {
      //console.log("Saxo token saved");
      return true;
    });
  };

  private remove_token = () => {
    const file = Bun.file(token_file);
    return file.exists().then(async (exists) => {
      if (exists) await file.delete();
    });
  };

  private make_token_params = (
    code: string,
    grant_type: "authorization_code" | "refresh_token",
  ): RequestInit => {
    const auth_string = btoa(`${conf.saxo.app_key}:${conf.saxo.app_secret}`);
    const params = [
      `grant_type=${grant_type}`,
      `${grant_type === "authorization_code" ? "code" : "refresh_token"}=${code}`,
      `redirect_uri=${this.redirect}`,
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
  private get redirect() {
    return `${this.http.url}${conf.saxo.url.redirect.token}`;
  }
  public token = {
    access_token: "",
    refresh_token: "",
  } as saxo_t.auth_token_t;
}
