import { Global } from "backend";

export class AccountsIbkr extends Global {
  public update = async () => {
    const { get, fetch } = this.ibkr.api;
    const { url, req_init } = get.accounts();
    const accounts = await fetch<b.i.account_t[]>(url, req_init);
    return accounts.map(this.frmt.account);
  };
  public balances = async (fx: lv.forex[]) => {
    const { get, fetch } = this.ibkr.api;
    const { frmt, db } = this;
    const fx_map = Object.fromEntries(fx.map((f) => [f.currency, f]));

    const acc_ids = await db.select
      .accounts(["broker", "ibkr"], ["a_id"])
      .then((accs) => accs.map((a) => a.a_id.split("_")[1]!));

    return Promise.all(
      acc_ids.map(async (id) => {
        const { url, req_init } = get.balance(id);
        return fetch<p.balance_res>(url, req_init).then((b) =>
          frmt.balances(b, fx_map),
        );
      }),
    ).then((balances) => balances.flat());
  };

  private frmt = {
    account: (account: b.i.account_t): g.account => {
      const { accountId, accountAlias: alias, currency } = account;
      return {
        a_id: `ibkr_${accountId}`,
        broker: "ibkr",
        alias,
        currency: util.money.patch_currency(currency),
      };
    },
    balances: (balances: p.balance_res, fx_map: lv.fx_map) => {
      delete balances.BASE;
      return Object.entries(balances).map((b) =>
        this.frmt.balance(...b, fx_map),
      );
    },
    balance: (
      currency: string,
      balance: b.i.balance_t,
      fx_map: lv.fx_map,
    ): lv.balance => {
      let {
        acctcode,
        cashbalance: cash,
        stockmarketvalue: assets_val,
      } = balance;
      const { money } = util;
      const broker: g.broker = "ibkr";
      currency = money.patch_currency(currency);
      const fractional = money.is_fractional(currency);
      const fx = fx_map[currency]!.close;
      cash = money.to_cents(cash, true);
      cash = money.convert_market(cash, fx, true);
      assets_val = money.to_cents(assets_val, fractional);
      assets_val = money.convert_market(assets_val, fx, fractional);
      const b_id = `${broker}_${acctcode}_${currency}` as id.b;
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

namespace p {
  export type balance_res = { [currency: string]: b.i.balance_t };
}
