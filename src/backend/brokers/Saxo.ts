import Fetch from "./saxo/Fetch";
import { saxo } from "./saxo/index";

export class Saxo extends Fetch {
  init_auth = () => this.authorise.init("saxo");

  wait_for_auth = () => this.authorise.wait_for_auth();
  is_authorised = () => this.authorise.is_authorised();

  get_code_url = () => this.authorise.get_code_url();
  set_token = (code: string) => this.oauth.set_token(code);
  refresh_token = (refresh_token: string) =>
    this.oauth.refresh_token(refresh_token);

  cache_accounts = () =>
    this.cache.saxo_accounts.length
      ? Promise.resolve(this.cache.saxo_accounts)
      : this.fetch_accounts_to_cache();

  cache_positions = () =>
    this.cache.saxo_positions.length
      ? Promise.resolve(this.cache.saxo_positions)
      : this.fetch_positions_to_cache();

  get_bar_data = (
    conid: string,
    period: period_t = [3, "y"],
    granularity: period_t = [1, "d"],
  ) =>
    this.stocks.bar_data(conid, period, granularity).then((data) => {
      logger.json("SAXO bar data", data);
      return this.stocks.map_bar_data(data);
    });

  private fetch_accounts_to_cache = () =>
    this.accounts
      .get_accounts()
      .then(this.cache_add_accounts.bind(this, "saxo"));

  private fetch_positions_to_cache = () =>
    this.positions
      .get_positions()
      .then(this.cache_add_positions.bind(this, "saxo"));

  accounts = new saxo.Accounts();
  positions = new saxo.Positions();
  oauth = new saxo.Oauth();
  stocks = new saxo.Stocks();
  authorise = new saxo.Authorise();
}

//private cache_saved() {
//  Cache.fx_pairs = saved_fx;
//
//  this.cache_add_accounts(
//    "saxo",
//    saved_accounts as unknown as saxo_t.account_t[],
//  );
//  this.cache_add_positions(
//    "saxo",
//    saved_positions as unknown as saxo_t.position_t[],
//  );
//  //Authorise.is_authorised = true;
//  //this.is_authorised = () => Promise.resolve(true);
//}
