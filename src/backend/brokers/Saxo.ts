import { Authorise, Fetch, factory, type factory_t } from "backend/saxo";
import { App, Cache } from "backend";
import type { saxo_t } from "types";

import saved_positions from "../../../.logs/SAXO_positions.json";
import saved_accounts from "../../../.logs/SAXO_accounts.json";
import saved_fx from "../../../.logs/FX_pairs.json";

export class Saxo extends Fetch {
  constructor(app: App) {
    super(app);

    const _factory = factory(this, this.app.http.url);
    this.authorise = _factory.authorise;
    this.oauth = _factory.oauth;
    this.positions = _factory.positions;
    this.accounts = _factory.accounts;

    this.cache_saved();
  }

  private cache_saved() {
    Cache.fx_pairs = saved_fx;

    this.cache_add_accounts(
      "saxo",
      saved_accounts as unknown as saxo_t.account_t[],
    );
    this.cache_add_positions(
      "saxo",
      saved_positions as unknown as saxo_t.position_t[],
    );
    Authorise.is_authorised = true;
    this.is_authorised = () => Promise.resolve(true);
  }

  wait_for_auth = () => this.authorise.wait_for_auth();
  is_authorised = () => this.authorise.is_authorised();
  get_code_url = () => this.authorise.get_code_url();
  set_token = (code: string) => this.oauth.set_token(code);

  cache_accounts = () =>
    this.cache.saxo_accounts.length
      ? Promise.resolve(this.cache.saxo_accounts)
      : this.fetch_accounts_to_cache();

  cache_positions = () =>
    this.cache.saxo_positions.length
      ? Promise.resolve(this.cache.saxo_positions)
      : this.fetch_positions_to_cache();

  private fetch_accounts_to_cache = () =>
    this.accounts
      .get_accounts()
      .then(this.cache_add_accounts.bind(this, "saxo"));

  private fetch_positions_to_cache = () =>
    this.positions
      .get_positions()
      .then(this.cache_add_positions.bind(this, "saxo"));

  public oauth: factory_t["oauth"];
  private authorise: factory_t["authorise"];
  private positions: factory_t["positions"];
  private accounts: factory_t["accounts"];
}
