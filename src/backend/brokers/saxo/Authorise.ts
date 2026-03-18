import { randomUUIDv7 } from "bun";
import { AuthBase } from "@backend/brokers/common";

const keepalive_interval = 1190000;

export class Authorise extends AuthBase {
  constructor() {
    super("saxo");
  }
  public is_authorised = async (): Promise<boolean> =>
    this.saxo.read_auth_token().then((token) => {
      if (!token) return (this.authorised = false);

      return this.saxo
        .refresh_token(token.refresh_token)
        .then((success) => (this.authorised = success));
    });

  public fetch_code_url = (): Promise<string> => {
    const base_url = conf.saxo.url.auth;
    return this.saxo.fetch(this.endpoint, base_url).then((res) => res.url);
  };

  private make_code_params = () => {
    const redirect = `${backend.app.http.url}${conf.saxo.url.redirect.code}`;
    return [
      "response_type=code",
      `client_id=${conf.saxo.app_key}`,
      `state=${randomUUIDv7("base64url", Date.now())}`,
      `redirect_uri=${encodeURI(redirect)}`,
    ].join("&");
  };

  public authorised = false;
  public keepalive_interval = keepalive_interval;

  private endpoint = `authorize?${this.make_code_params()}`;
}
