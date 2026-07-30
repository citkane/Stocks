import { Global } from "backend";

export class AccountsSaxo extends Global {
  public update = async () => {
    const { get, fetch } = this.saxo.api;
    const req = get.accounts();
    const accounts = await fetch<b.s.data_t<b.s.account_t>>(req);
    return accounts.Data.map(this.frmt.account);
  };
  public balances = async (fx: lv.forex[]): Promise<lv.balance[]> => {
    const { get, fetch } = this.saxo.api;
    const { frmt, db } = this;
    const fx_map = Object.fromEntries(fx.map((f) => [f.currency, f]));

    const acc_keys = await db.select
      .accounts(["broker", "saxo"], ["broker_key", "a_id"])
      .then((accs) => accs.map((a) => [a.broker_key!, a.a_id] as const));

    return Promise.all(
      acc_keys.map(async ([key, a_id]) => {
        const req = get.balance(key);
        return fetch<b.s.balance_t>(req).then((bal) =>
          frmt.balance(a_id, bal, fx_map),
        );
      }),
    );
  };
  private frmt = {
    account: (account: b.s.account_t): g.account => {
      const {
        AccountId,
        DisplayName: alias,
        Currency: currency,
        AccountKey: broker_key,
      } = account;
      return {
        a_id: `saxo_${AccountId}`,
        broker: "saxo",
        alias,
        currency: util.money.patch_currency(currency),
        broker_key,
      };
    },
    balance: (
      a_id: id.a,
      balance: b.s.balance_t,
      fx_map: lv.fx_map,
    ): lv.balance => {
      let {
        Currency: currency,
        UnrealizedPositionsValueExcludingCostToClosePositions: assets_val,
        CashBalance: cash,
      } = balance;
      const { money } = util;
      currency = money.patch_currency(currency);
      const fractional = money.is_fractional(currency);
      const fx = fx_map[currency]!.close;
      cash = money.to_cents(cash, true);
      cash = money.convert_market(cash, fx, fractional);
      assets_val = money.to_cents(assets_val, true);
      assets_val = money.convert_market(assets_val, fx, fractional);

      const b_id: id.b = `${a_id}_${currency}`;
      return {
        b_id,
        currency,
        assets_val,
        cash,
        fx,
      };
    },
  };
}
