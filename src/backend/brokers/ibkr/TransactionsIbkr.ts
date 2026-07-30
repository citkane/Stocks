import { Global } from "@backend/Global";

export class TransactionsIbkr extends Global {
  public update = async (days_ago: number) => {
    if (!days_ago) return [];

    const { db, data, frmt, root_currency } = this;
    return Promise.all([
      db.select.instrmnts(["ibkr_id", true]),
      db.select.accounts(["broker", "ibkr"]).then((a) => a.map((a) => a.a_id)),
    ])
      .then(([instrmnts, a_ids]) =>
        data.fetch([a_ids, instrmnts, root_currency, days_ago] as const),
      )
      .then(frmt.transctns)
      .then(async (transctns) => {
        await this.db.insert.transctns.last_update("ibkr", util.time.ms_now());
        return transctns;
      });
  };

  public last_update_date = async () => {
    let date = await this.db.select.transctns.last_update("ibkr");
    date ??= util.time.ms(conf.ibkr.start_date);
    return util.time.aging_days(date);
  };

  private frmt = {
    transctns: async ([trans, instrmnts]: readonly [
      b.i.transaction_t[],
      g.instrmnt[],
    ]) => {
      const { frmt, data } = this;
      const views = data.categorise(trans);
      const instrmt_map = Object.fromEntries(
        instrmnts.map((i) => [i.ibkr_id!, i]),
      ) as { [conid: number]: g.instrmnt };

      return Object.values(views).reduce((trans, cat) => {
        data
          .reconcile_transfers(cat)
          .forEach((tr) => trans.push(frmt.transctn(tr, instrmt_map)));
        return trans;
      }, [] as g.transctn[]);
    },
    transctn: (
      transctn: b.i.transaction_t,
      instrmnts: { [conid: number]: g.instrmnt },
    ): g.transctn => {
      const { data } = this;
      let {
        conid,
        acctid: a_id,
        cur: currency,
        qty: amount,
        amt,
        pr,
        fxRate: traded_fx,
        date: date_string,
        type,
      } = transctn;
      let instrmnt = instrmnts[conid];
      if (!instrmnt) {
        logger.error("No position found for transaction", "ibkr", conid);
        instrmnt = {
          i_id: `undefined-undefined`,
        } as unknown as g.instrmnt;
      }
      const { i_id } = instrmnt,
        date = util.time.ms(date_string),
        id = data.make_uid(transctn),
        broker = "ibkr",
        traded_price = pr || amt;

      let kind: g.transctn["kind"];
      switch (type) {
        case "Buy":
          kind = "buy";
          break;
        case "Transfer":
          kind = "buy";
          break;
        case "Sell":
          kind = "sell";
          break;
        case "Dividend Payment":
          kind = "dividend";
      }

      return {
        id,
        a_id,
        i_id,
        broker,
        currency,
        amount: amount || 1,
        traded_price,
        traded_fx,
        date,
        kind,
      };
    },
  };
  private data = {
    fetch: async ([a_ids, instrmnts, currency, days]: readonly [
      string[],
      g.instrmnt[],
      string,
      number,
    ]) => {
      const { post, fetch } = this.ibkr.api,
        { bootstrap } = this,
        conids = instrmnts.map((i) => i.ibkr_id!);

      let count = 0;
      a_ids = a_ids.map((a) => a.split("_")[1]!);
      /* FUCK IBKR!!!!
       * It is only possibly to fetch transactions for ONE fucking conid at a time.
       * Rate limits ARE hit!!!
       * Support is NOT fucking interested
       */
      const promises = conids.map(async (conid) => {
        const { url, req_init } = post.transactions([
          a_ids,
          [conid],
          currency,
          days,
        ]);
        return fetch<b.i.transctns_res>(url, req_init)
          .then((t) => {
            messg();
            return t.transactions || [];
          })
          .catch((err) => {
            messg();
            logger.error(err);
            return [];
          });
      });

      return Promise.all(promises)
        .then((transctns) => transctns.flat())
        .then((t) => {
          // logger.json("IBKR TRNSCTN RAW", t);
          return t;
        })
        .then((transctns) => [transctns, instrmnts] as const);

      function messg() {
        count++;
        bootstrap(
          `IBKR checked ${count} of ${conids.length} positions for new transactions`,
        );
      }
    },

    reconcile_transfers: (views: p.categorised) => {
      let { Transfer, Buy, Sell } = views;

      if (!Transfer.length) return Object.values(views).flat();

      Transfer = Transfer.map(normalise_trans_vals);
      const transfers = split_buy_sell_trans(Transfer);
      Object.values(transfers).forEach(({ trans_b, trans_s }) => {
        trans_s = discard_matching_sells(trans_b, trans_s);
        trans_s.forEach((s) => {
          s.type = "Sell";
          Sell.push(s);
        });
        trans_b = res_buys_acc_or_ext(trans_b);
        Buy = Buy.filter((b) => de_dupe_buys(b, trans_b));
        Buy = [...Buy, ...trans_b];
      });
      return [...Buy, ...Sell, ...views["Dividend Payment"]];

      function normalise_trans_vals(t: b.i.transaction_t) {
        const { qty, desc } = extrude_desc(t.desc);
        const pr = t.amt / qty;
        t.qty = qty;
        t.pr = pr;
        t.desc = desc;
        return t;
      }

      function extrude_desc(desc: string) {
        const [part_desc, part_qty] = desc.split("Quantity: ") as [
          string,
          string,
        ];
        const qty = Number(part_qty.trim().replaceAll(",", ""));
        desc = part_desc.trim().replace(/\s*\([^()]*\)\s*$/, "");
        return { qty, desc };
      }
      function split_buy_sell_trans(transfers: b.i.transaction_t[]) {
        return transfers.reduce(
          (transfers, transctn) => {
            const { conid, amt } = transctn;
            transfers[conid] ??= { trans_b: [], trans_s: [] };
            amt > 0
              ? transfers[conid].trans_b.push(transctn)
              : transfers[conid].trans_s.push(transctn);
            return transfers;
          },
          {} as {
            [conid: number]: {
              trans_b: b.i.transaction_t[];
              trans_s: b.i.transaction_t[];
            };
          },
        );
      }

      function res_buys_acc_or_ext(ins: b.i.transaction_t[]) {
        const potential_buys = Buy.filter((b) =>
          ins.find((i) => match_buy(i, b)),
        );
        const total_qty = ins.reduce((tally, { qty }) => {
          tally += qty!;
          return tally;
        }, 0);
        const matching_buys = find_buy_subset(potential_buys, total_qty);
        if (!matching_buys)
          return ins.map((i) => {
            i.type = "Buy";
            return i;
          });

        const current_acc = ins.sort((a, b) =>
          b.rawDate.localeCompare(a.rawDate),
        )[ins.length - 1]!.acctid;
        return matching_buys.map((b) => {
          b.acctid = current_acc;
          return b;
        });
      }
      function find_buy_subset(
        potential_buys: b.i.transaction_t[],
        total_qty: number,
      ) {
        const parent = new Map<
          number,
          { item: b.i.transaction_t; prev: number }
        >();
        const achievable = new Set([0]);
        const result: b.i.transaction_t[] = [];

        for (const buy of potential_buys) {
          const sums = Array.from(achievable);
          for (const sum of sums) {
            const next_sum = sum + buy.qty!;
            if (next_sum > total_qty) continue;

            if (!achievable.has(next_sum)) {
              achievable.add(next_sum);
              parent.set(next_sum, { item: buy, prev: sum });
            }
          }
          if (achievable.has(total_qty)) break;
        }

        if (!achievable.has(total_qty)) {
          return null;
        }

        let curr = total_qty;
        while (curr > 0) {
          const { item, prev } = parent.get(curr)!;
          result.push(item);
          curr = prev;
        }
        return result;
      }

      function discard_matching_sells(
        ins: b.i.transaction_t[],
        outs: b.i.transaction_t[],
      ) {
        return outs.filter((o) => !ins.find((i) => match_transfer(o, i)));
      }

      function match_transfer(src: b.i.transaction_t, targ: b.i.transaction_t) {
        return (
          src.conid === targ.conid && Math.abs(src.amt) === Math.abs(targ.amt)
        );
      }
      function match_buy(i: b.i.transaction_t, b: b.i.transaction_t) {
        return (
          i.conid === b.conid &&
          util.time.ms(b.date) <= util.time.ms(i.date) &&
          b.qty! <= i.qty!
        );
      }
      function de_dupe_buys(
        b: b.i.transaction_t,
        transfers: b.i.transaction_t[],
      ) {
        return !transfers.find(
          (t) => t.qty === b.qty && t.conid === b.conid && t.date === b.date,
        );
      }
    },

    categorise: (t: b.i.transaction_t[]) => {
      const transctns = {} as {
        [conid: number]: p.categorised;
      };
      return t.reduce((transctns, t) => {
        const { type, conid } = t;
        transctns[conid] ??= {
          Buy: [],
          Sell: [],
          Transfer: [],
          "Dividend Payment": [],
        };
        if (!t.isRealTime) transctns[conid]![type].push(t);

        return transctns;
      }, transctns);
    },

    make_uid: (trnsctn: b.i.transaction_t) => {
      const hasher = new Bun.CryptoHasher("md5");
      hasher.update(JSON.stringify(trnsctn));
      return hasher.digest("hex");
    },
  };
}
namespace p {
  type events = b.i.transaction_t["type"];
  export type categorised = {
    [key in events]: b.i.transaction_t[];
  };
}
