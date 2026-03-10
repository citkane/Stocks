import { Authorise, Fetch, factory, type factory_t } from "backend/ibkr";
import { Brokers, Cache, type App } from "backend";
import type { ibkr_t } from "types";

import saved_positions from "../../../.logs/IBKR_positions.json";
import saved_accounts from "../../../.logs/IBKR_accounts.json";
import saved_fx from "../../../.logs/FX_pairs.json";

export class Ibkr extends Fetch {
  constructor(app: App) {
    super(app);

    const _factory = factory(this);
    this.authorise = _factory.authorise;
    this.accounts = _factory.accounts;
    this.positions = _factory.positions;

    //this.cache_saved();
  }

  private cache_saved() {
    Cache.fx_pairs = saved_fx;

    this.cache_add_accounts(
      "ibkr",
      saved_accounts as unknown as ibkr_t.account_t[],
    );
    this.cache_add_positions(
      "ibkr",
      saved_positions as unknown as ibkr_t.position_t[],
    );
    Authorise.is_authorised = true;
    this.is_authorised = () => Promise.resolve(true);
  }

  is_authorised = () => this.authorise.is_authorised();
  wait_for_auth = () => this.authorise.wait_for_auth();

  cache_accounts = () =>
    this.cache.ibkr_accounts.length
      ? Promise.resolve()
      : this.fetch_accounts_to_cache();

  cache_positions = () =>
    this.cache.ibkr_positions.length
      ? Promise.resolve()
      : this.fetch_positions_to_cache();

  cache_fx = () =>
    Cache.has_fx_pairs ? Promise.resolve() : this.fetch_fx_to_cache();

  private fetch_accounts_to_cache = () =>
    this.accounts
      .get_accounts()
      .then(this.cache_add_accounts.bind(this, "ibkr"));

  private fetch_positions_to_cache = () =>
    Promise.all(
      this.cache.ibkr_accounts.map((a) =>
        this.positions.get_positions(a.original_id),
      ),
    )
      .then((p) => p.flat() as ibkr_t.position_t[])
      .then(this.positions.audit_positions)
      .then(this.positions.merge_position_transactions)
      .then(this.cache_add_positions.bind(this, "ibkr"))
      .catch((err) => {
        console.error(err, "IBKR positions");
      });

  private fetch_fx_to_cache = () => {
    return Promise.all(
      Brokers.currencies.map((source) =>
        this.accounts.get_fx(source, Brokers.base_currency).then((rate) => {
          return { [source]: rate.rate };
        }),
      ),
    ).then(this.cache_add_fx);
  };

  private accounts: factory_t["accounts"];
  private positions: factory_t["positions"];
  private authorise: factory_t["authorise"];
}
