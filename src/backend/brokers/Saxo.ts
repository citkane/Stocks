import {
  Fetch,
  factory,
  type authorise_f,
  type positions_f,
  type outh_f,
  type factory_t,
} from "./saxo/index.ts";

import type { App, Cache } from "..";
import type { ServerWs } from "../servers";

export class Saxo extends Fetch {
  constructor(private app: App) {
    super();
    this.ws = this.app.ws;
    this.cache = this.app.cache;

    const _factory = factory(this);
    this.authorise = _factory.authorise.bind(this)(this.app.http.url);
    this.oauth = _factory.oauth.bind(this)(this.app.http.url);
    this.positions = _factory.positions.bind(this)();
    this.accounts = _factory.accounts;

    this.fetch = this.fetch.bind(this);
  }

  public is_authorised = () => this.authorise.is_authorised();
  public get_code_url = () => this.authorise.get_code_url();
  public set_token = (code: string) =>
    this.oauth
      .set_token(code)
      .then((success) => this.ws.publish("authorised", success, ["saxo"]));

  public get_accounts = () =>
    this.accounts
      .get_accounts()
      .then((accounts) => this.cache.add.accounts(accounts, "saxo"));

  public positions: positions_f;
  private accounts!: factory_t["accounts"];
  protected authorise: authorise_f;
  protected oauth: outh_f;

  public cache: Cache;
  protected ws: ServerWs;
  protected keepalive?: ReturnType<typeof setInterval>;
}
