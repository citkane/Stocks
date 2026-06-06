import { Auth } from "@backend/brokers";
import type { EndpointsSaxo as fetch_t } from "./EndpointsSaxo";

const ping_auth_interval = 300000;
const token_file = Bun.file(".temp/saxo.token.json");

class Oauth extends Auth {
  constructor(
    protected fetch: fetch_t["fetch"],
    protected get: fetch_t["get"],
    protected post: fetch_t["post"],
  ) {
    super("saxo", ping_auth_interval);
  }
  public fetch_token = (code: string): Promise<boolean> => {
    const req = this.post.token(code, "authorization_code");
    logger.debug("Fetch auth token", "saxo");
    return this.fetch<b.s.auth_token_t>(req).then(this.token.store);
  };
  public fetch_client_key = () => {
    const req = this.get.client();
    return this.fetch<b.s.client_t>(req).then((data) => data.ClientKey);
  };
  public logout = () => {
    if (!this.auth_state) return;
    const req = this.get.logout();
    this.fetch(req).then(() => logger.info("SAXO logged out"));
  };

  protected token = {
    read: (): Promise<b.s.auth_token_t | false> =>
      token_file.json().catch(() => false),

    refresh: (refresh_token: string) => {
      logger.debug("Refresh auth token", "saxo");
      const req = this.post.token(refresh_token, "refresh_token");
      console.log(req);
      return this.fetch<b.s.auth_token_t>(
        req,
        (req: Request, res: Response) => {
          console.log(res);
          return res.json();
        },
      )
        .then((token) => {
          console.log({ token });
          return token;
        })
        .then(this.token.store)
        .catch((err) => this.token.remove(err).then(() => false));
    },
    store: (token: b.s.auth_token_t) => {
      console.log({ token });
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
  constructor(
    fetch: fetch_t["fetch"],
    get: fetch_t["get"],
    post: fetch_t["post"],
  ) {
    super(fetch, get, post);
  }
  public fetch_code_url = (): Promise<string> => {
    const req = this.get.auth_url();
    const { resolve } = Promise;
    const data_handler = (_req: Request, res: Response) => resolve(res.url);
    return this.fetch<string>(req, data_handler)
      .then((url) => url)
      .catch((err) => {
        console.error(err);
        throw Error(err);
      });
  };
  public is_authorised = async () => {
    const token = await this.token.read();
    return !!token ? this.token.refresh(token.refresh_token) : false;
  };
}
