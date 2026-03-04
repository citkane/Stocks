import { Fetch, factory, type factory_t } from "backend/ibkr";
import type { App, Cache, ServerWs } from "backend";
import type { ibkr_t } from "types";

const base_currency: currency_t = "EUR";

export class Ibkr extends Fetch {
  constructor(private app: App) {
    super();

    const _factory = factory(this);
    this.authorise = _factory.authorise;
    this.accounts = _factory.accounts;
    this.positions = _factory.positions;

    this.cache = this.app.cache;
    this.ws = this.app.ws;

    this.authorise.wait_for_authorised().then(() => {
      this.authorise.keep_alive();
      this.ws.publish("authorised", true, ["ibkr"]);
    });
  }

  public is_authorised = () => this.authorise.is_authorised();
  public wait_for_authorised = () => this.authorise.wait_for_authorised();

  public get_accounts = async () => {
    return this.accounts.get_accounts().then((accounts) => {
      this.cache.add.accounts(accounts, "ibkr");
      console.json("IBKR accounts", accounts);
      return true;
    });
  };
  public get_positions = async () => {
    if (this.cache.positions.length > 0) return Promise.resolve(true);
    if (!this.cache.ibkr_accounts) await this.get_accounts();

    const positions_partial = await Promise.all(
      this.cache.ibkr_accounts!.map((account) => {
        return this.positions.get_positions(account.original_id);
      }),
    ).then((positions) => positions.flat());
    console.json("IBKR_positions_partial", positions_partial);

    const positions = await Promise.all(
      positions_partial.map((p) => {
        return p.name ? p : this.positions.get_position(p.acctId!, p.conid!);
      }),
    ).then((p) => p.flat() as ibkr_t.position_t[]);
    console.json("IBKR_positions", positions);

    const transactions = await Promise.all(
      positions.map((p) => {
        return this.positions.transactions_history(
          this.cache.ibkr_account_ids,
          p.conid!,
          base_currency,
        );
      }),
    );
    console.json("IBKR_transactions", transactions);

    //this.cache.add.positions(positions, "ibkr");
    //console.json("IBKR positions", positions);
    return true;

    //return this.get_transactions();
  };
  //private get_transactions = async () => {
  //  const { ibkr_accounts, ibkr_positions } = this.cache;
  //  const account_ids = ibkr_accounts!.map((a) => a.original_id);
  //  const pos_ids = ibkr_positions!.map((p) => p.original_id);
  //  const all_transactions: ibkr_t.transaction_t[][] = [];
  //
  //  await Promise.all(
  //    pos_ids.map((id) => {
  //      return this.positions
  //        .transactions_history(account_ids, id, "EUR")
  //        .then((transactions) => {
  //          all_transactions.push(transactions);
  //          this.cache.add.transactions(transactions);
  //        });
  //    }),
  //  );
  //  console.json("IBKR_transactions", all_transactions);
  //  return Promise.resolve();
  //};

  public accounts: factory_t["accounts"];
  protected positions: factory_t["positions"];
  protected authorise: factory_t["authorise"];
  protected cache: Cache;
  private ws: ServerWs;
}
