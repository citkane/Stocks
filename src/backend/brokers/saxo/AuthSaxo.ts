import { Auth } from "@backend/brokers";

const ping_auth_interval = 300000;
const token_file = Bun.file(".temp/saxo.token.json");

class Oauth extends Auth {
  constructor() {
    super("saxo", ping_auth_interval);
  }
  public fetch_token = (code: string): Promise<boolean> => {
    const endpoint = this.saxo.endpoints.post.token(code, "authorization_code");
    logger.debug("Fetch auth token", "saxo");
    return this.saxo
      .fetch<b.s.auth_token_t>(endpoint.url, endpoint.params)
      .then(this.token.store);
  };
  public fetch_client_key = () => {
    const url = this.saxo.endpoints.get.client();
    return this.saxo.fetch<b.s.client_t>(url).then((data) => data.ClientKey);
  };
  public logout = () => {
    if (!this.auth_state) return;
    this.saxo
      .fetch(this.saxo.endpoints.get.logout())
      .then(() => logger.info("SAXO logged out"));
  };

  protected token = {
    read: (): Promise<b.s.auth_token_t | false> =>
      token_file.json().catch(() => false),

    refresh: (refresh_token: string) => {
      const endpoint = this.saxo.endpoints.post.token(
        refresh_token,
        "refresh_token",
      );
      logger.debug("Refresh auth token", "saxo");
      return this.saxo
        .fetch<b.s.auth_token_t>(endpoint.url, endpoint.params)
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

export class AuthSaxo extends Oauth {
  constructor() {
    super();
  }
  public fetch_code_url = (): Promise<string> => {
    return this.saxo
      .fetch<Response>(this.saxo.endpoints.get.code_url())
      .then((res) => res.url);
  };
  public is_authorised = async () => {
    const token = await this.token.read();
    return !!token ? this.token.refresh(token.refresh_token) : false;
  };
}
