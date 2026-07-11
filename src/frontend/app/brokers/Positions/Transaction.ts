import { Position } from "./";

export class Transaction {
  constructor(
    private be_transctn: be.transctn,
    private positn: Position,
  ) {
    Object.freeze(be_transctn);
    const { currency } = be_transctn;
    this.fractional = !["ZAC", "GBX"].includes(currency);
  }
  public get transctn(): filter.transctn {
    return {
      fractional: this.fractional,
      ...this.get_traded(this.be_transctn),
      ...this.live,
      meta: {},
    };
  }

  private get_traded = (transctn: be.transctn) => {
    let { price_traded, amount, kind } = transctn;
    amount = Math.abs(amount);
    const traded = {
      price_traded: this.fractional ? price_traded * 100 : price_traded, // proceed in cents
      dividend: 0,
      div_est: 0,
      r_pl: 0,
      ur_pl: 0,
      amount,
    };
    switch (kind) {
      case "dividend":
        traded.dividend = traded.price_traded;
        traded.price_traded = 0;
        traded.amount = 0;
        break;
      case "unbooked":
        traded.amount = 0;
    }
    const value_traded = traded.price_traded * traded.amount;
    const state =
      kind === "buy" ? "open" : kind === "unbooked" ? "unbooked" : undefined;

    return { ...transctn, ...traded, value_traded, state } as const;
  };

  private get live() {
    let { amount, kind } = this.be_transctn;
    let { close: price_market, fx: fx_market } = this.positn.live,
      value_market = 0;
    amount = Math.abs(amount);
    if (kind === "dividend" || kind === "unbooked") {
      price_market = 0;
    } else {
      price_market = this.fractional ? price_market * 100 : price_market; // proceed in cents
      value_market = price_market * amount;
    }

    return {
      price_market,
      value_market,
      fx_market,
    };
  }

  private fractional: boolean;
}
