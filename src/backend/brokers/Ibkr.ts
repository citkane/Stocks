import Fetch from "./ibkr/Fetch";
import { ibkr } from "./ibkr/index";

export class Ibkr extends Fetch {
  init_auth = () => this.authorise.init("ibkr");

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
    this.cache.has_fx_pairs ? Promise.resolve() : this.fetch_fx_to_cache();

  get_bar_data = (
    conid: string,
    period: period_t = [3, "y"],
    granularity: period_t = [1, "d"],
  ) =>
    this.stocks
      .bar_data(
        conid,
        util.string.period(period),
        util.string.period(granularity),
      )
      .then((data) => {
        logger.json("IBKR bar data", data);
        return this.stocks.map_bar_data(data.data);
      });

  private fetch_accounts_to_cache = () =>
    this.accounts
      .get_accounts()
      .then(this.cache_add_accounts.bind(this, "ibkr"));

  private fetch_positions_to_cache = () =>
    Promise.all(
      this.cache.ibkr_accounts.map((a) =>
        this.positions.get_positions(a.a_id_original),
      ),
    )
      .then((p) => p.flat() as ibkr_t.position_t[])
      .then(this.positions.audit_positions)
      .then(this.positions.merge_position_transactions)
      .then(this.cache_add_positions.bind(this, "ibkr"))
      .catch((err) => {
        logger.error(err, "IBKR positions");
      });

  private fetch_fx_to_cache = () => {
    return Promise.all(
      this.brokers.currencies.map((source) =>
        this.accounts
          .get_fx(source, this.brokers.base_currency)
          .then((rate) => {
            return { [source]: rate.rate };
          }),
      ),
    ).then(this.cache_add_fx);
  };

  accounts = new ibkr.Accounts();
  positions = new ibkr.Positions();
  stocks = new ibkr.Stocks();
  authorise = new ibkr.Authorise();
}

//private _cache_saved() {
//  Cache.fx_pairs = saved_fx;
//
//  cache_add_accounts(
//    "ibkr",
//    saved_accounts as unknown as ibkr_t.account_t[],
//  );
//  cache_add_positions(
//    "ibkr",
//    saved_positions as unknown as ibkr_t.position_t[],
//  );
//  //Authorise.is_authorised = true;
//  //this.is_authorised = () => Promise.resolve(true);
//}
