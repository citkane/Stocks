import { Auth } from "@backend/brokers";

const ping_auth_interval = 300000;
const token_file = Bun.file(".temp/saxo.token.json");

export class AuthSaxo extends Auth {
  constructor() {
    super("saxo", ping_auth_interval);
  }
  public await_auth = () => this.resolver(this.check_auth);

  public fetch_code_url = <T = string>(): Promise<T> => {
    const { get, fetch } = this.saxo.api;
    const req = get.auth_url();
    const response_cb = (res: Response) => res.url;
    return fetch<T>(req, { response_cb })
      .then((url) => url)
      .catch((err) => {
        console.error(err);
        throw Error(err);
      });
  };
  public fetch_token = (code: string): Promise<boolean> => {
    const { post, fetch } = this.saxo.api;
    const req = post.token(code, "authorization_code");
    logger.debug("Fetch auth token", "saxo");
    return fetch<b.s.auth_token_t>(req).then(this.token.store);
  };
  public fetch_client_key = () => {
    const { get, fetch } = this.saxo.api;
    const req = get.client();
    return fetch<b.s.client_t>(req).then((data) => data.ClientKey);
  };
  public logout = async () => {
    const { get, fetch } = this.saxo.api;
    const req = get.logout();
    return this.revoke_auth(fetch(req));
  };
  private check_auth = async () => {
    const token = await this.token.read();
    return !!token ? this.token.refresh(token.refresh_token) : false;
  };

  private token = {
    read: (): Promise<b.s.auth_token_t | false> =>
      token_file.json().catch(() => false),

    refresh: (refresh_token: string) => {
      logger.debug("Refresh auth token", "saxo");
      const { post, fetch } = this.saxo.api;
      const req = post.token(refresh_token, "refresh_token");
      return fetch<b.s.auth_token_t>(req)
        .then(this.token.store)
        .catch((err) => this.token.remove(err).then(() => false));
    },
    store: (token: b.s.auth_token_t) => {
      this.auth_token = token;
      return token_file.write(JSON.stringify(token)).then(() => true);
    },
    remove: (err: any) => {
      logger.warn("Failed to refresh SAXO auth token", { err });
      return token_file.delete().catch(() => Promise.resolve());
    },
  };

  public auth_token = {
    access_token: "",
    refresh_token: "",
  } as b.s.auth_token_t;
}
