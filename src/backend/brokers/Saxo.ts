import { Fetch, factory, type factory_t } from "backend/saxo";
import type { App, Cache, ServerWs } from "backend";

export class Saxo extends Fetch {
  constructor(private app: App) {
    super();
    this.ws = this.app.ws;
    this.cache = this.app.cache;

    const _factory = factory(this, this.app.http.url);
    this.authorise = _factory.authorise;
    this.oauth = _factory.oauth;
    this.positions = _factory.positions;
    this.accounts = _factory.accounts;

    this.fetch = this.fetch.bind(this);
  }
  public wait_for_authorised = () => this.authorise.wait_for_authorised();
  public is_authorised = () => this.authorise.is_authorised();
  public get_code_url = () => this.authorise.get_code_url();
  public set_token = (code: string) =>
    this.oauth
      .set_token(code)
      .then((success) => this.ws.publish("authorised", success, ["saxo"]));

  public get_accounts = () =>
    this.accounts.get_accounts().then((accounts) => {
      console.json("SAXO accounts", accounts);
      this.cache.add.accounts(accounts, "saxo");
    });

  public get_positions = () =>
    this.positions.get_positions().then((positions) => {
      console.json("SAXO positions", positions);
      this.cache.add.positions(positions, "saxo");
    });

  public positions: factory_t["positions"];
  public oauth: factory_t["oauth"];
  private accounts: factory_t["accounts"];
  protected authorise: factory_t["authorise"];

  public cache: Cache;
  protected ws: ServerWs;
}
