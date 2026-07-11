import { Position } from "./";

export class Positions {
  public static set = {
    instrmnt: (...instrmnts: filter.instrmnt[]) => {
      instrmnts.forEach((instrmnt) => {
        const { i_id } = instrmnt;
        this.positions[i_id] = new Position(instrmnt);
      });
    },
    transactn: (...transctns: be.transctn[]) => {
      transctns.forEach((transctn) => {
        const { i_id } = transctn;
        const positn = this.positions[i_id];
        if (!positn) return this.set_unbooked(transctn);
        positn.set.transactn(transctn);
      });
    },
    live_data: (...live_data: lv.positn[]) => {
      const { positions } = this;
      live_data.forEach((data) => {
        const { i_id } = data;
        const position = positions[i_id];
        if (!position) throw `No position ${i_id} for live data`;

        position.set.live_data(data);
      });
    },
  };

  public static get positns() {
    return Object.values(this.positions).reduce(
      (positns, p) => {
        const { i_id } = p.instrmnt;
        positns[i_id] = {
          instrmnt: p.instrmnt,
          transctns: p.transctns,
        };
        return positns;
      },
      {} as {
        [i_id: string]: {
          instrmnt: filter.instrmnt;
          transctns: filter.transctn[];
        };
      },
    );
  }

  public static tally = {
    positions: (...tallys: p.tally[]) => {
      const total = this.empty_tally();
      tallys.forEach((tally) => {
        Object.keys(total).forEach((key) => {
          const val = tally[key as keyof typeof tally];
          total[key as keyof typeof tally] += Number(val);
        });
      });
      return total;
    },
    transactions: (...transctns: filter.transctn[]) => {
      const tally = this.empty_tally();
      transctns.forEach((transctn) => {
        if (transctn.currency === "ZAC") return;
        Object.keys(tally).forEach((key) => {
          const val = transctn[key as keyof filter.transctn];
          tally[key as keyof typeof tally] += Number(val);
        });
      });
      return tally;
    },
  };

  private static set_unbooked(transactn: be.transctn) {
    transactn.kind = "unbooked";
    const { currency, i_id } = transactn;
    const [exchange, ticker] = i_id.split("-") as [string, string];
    const instrmnt: filter.instrmnt = {
      i_id,
      ticker,
      exchange,
      currency,
      geo: {},
      meta: { description: "unbooked", asset_class: "stock" },
    };
    this.set.instrmnt(instrmnt);
    this.positions[i_id]!.set.transactn(transactn);
  }
  private static empty_tally = (): p.tally => ({
    value_market: 0,
    value_traded: 0,
    r_pl: 0,
    ur_pl: 0,
    fx_pl: 0,
    div_est: 0,
    dividend: 0,
  });

  private static positions = {} as { [i_id: string]: Position };
}

namespace p {
  export type tally = {
    value_market: number;
    value_traded: number;
    r_pl: number;
    ur_pl: number;
    fx_pl: number;
    div_est: number;
    dividend: number;
  };
}
