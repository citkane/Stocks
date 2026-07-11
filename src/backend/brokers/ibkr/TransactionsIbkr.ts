import { Global } from "@backend/Global";

export class TransactionsIbkr extends Global {
  public update = async (days_ago: number) => {
    if (!days_ago) return [];

    const { db, transctns, frmt, root_currency } = this;

    return Promise.all([
      db.select.instrmnts(["ibkr_id", true]),
      db.select.accounts.data("ibkr").then((a) => a.map((a) => a.a_id)),
    ])
      .then(([instrmnts, a_ids]) =>
        transctns.fetch([a_ids, instrmnts, root_currency, days_ago] as const),
      )
      .then(frmt.transform);
  };
  public last_update_date = async () => {
    const [date] = await this.db.select.transctns(
      ["broker", "ibkr"],
      ["date"],
      ["date", "DESC"],
    );
    const days_ago = date?.date
      ? util.time.aging_days(date.date)
      : util.time.aging_days(conf.ibkr.start_date);

    return days_ago;
  };
  private frmt = {
    /**
     * Transforms IBKR transactions to the normalised frontend transaction type.
     */
    transform: async ([transctns, instrmnts]: readonly [
      b.i.transaction_t[],
      g.instrmnt[],
    ]) => {
      const { frmt } = this,
        cats = frmt.categorise(transctns),
        instrmt_map = Object.fromEntries(
          instrmnts.map((i) => [i.ibkr_id!, i]),
        ) as { [conid: number]: g.instrmnt };

      return Object.values(cats).reduce((transctns, cat) => {
        frmt
          .resolve_transfers(cat)
          .forEach((tr) => transctns.push(frmt.format(tr, instrmt_map)));

        return transctns;
      }, [] as g.transctn[]);
    },
    categorise: (t: b.i.transaction_t[]) => {
      const transctns = {} as {
        [conid: number]: p.categorised;
      };
      return t.reduce((transctns, t) => {
        const { type, conid } = t;
        if (!transctns[conid]) transctns[conid] = {} as any;
        if (!transctns[conid]![type]) transctns[conid]![type] = [];
        if (!t.isRealTime) transctns[conid]![type].push(t);

        return transctns;
      }, transctns);
    },
    format: (
      transctn: b.i.transaction_t,
      instrmnts: { [conid: number]: g.instrmnt },
    ): g.transctn => {
      const { frmt } = this;
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
        id = frmt.make_uid(transctn),
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
    make_uid: (trnsctn: b.i.transaction_t) => {
      //  const string = Object.keys(transaction)
      //    .map((key) => transaction[key as keyof typeof transaction])
      //    .join("");
      const hasher = new Bun.CryptoHasher("md5");
      hasher.update(JSON.stringify(trnsctn));
      return hasher.digest("hex");
    },
    /** Identifies external transfers in and converts them to buy.
     *  Maps transfer account ids to buys.*/
    resolve_transfers: (view: p.categorised) => {
      let { Transfer, Buy } = view;
      if (!Transfer) return Object.values(view).flat();

      if (!Buy) Buy = [];
      const transfers = Transfer.sort((a, b) =>
        b.rawDate.localeCompare(a.rawDate),
      )
        .map((transfer) => {
          let { desc, amt, rawDate } = transfer;

          const kind = amt! > 0 ? "in" : "out";
          const qty = Number(desc.split("Quantity: ")[1]!.replaceAll(",", ""));
          let pr = amt / qty;
          //pr = pr / 100;

          const match = desc.match(/\(([^)]+)\)/);
          let id = match ? match[0] : "";
          id = `${id}_${rawDate}_${Math.abs(qty)}`;

          return { ...transfer, ...{ id, kind, pr, qty } };
        })
        .map((transfer, _i, original) => {
          const is_external =
            original.filter((t) => transfer.id === t.id).length === 1;
          return is_external
            ? { ...transfer, ...{ kind: "external" } }
            : transfer;
        })
        .reduce(
          (transfers, transfer) => {
            const { kind } = transfer;
            transfers[kind as keyof typeof transfers].push(transfer);
            return transfers;
          },
          { in: [], out: [], external: [] } as {
            in: b.i.transaction_t[];
            out: b.i.transaction_t[];
            external: b.i.transaction_t[];
          },
        );
      Buy = Buy.map((buy) => {
        const { acctid } = transfers.in[0]!;
        return { ...buy, ...{ acctid } };
      });
      view.Buy = [...Buy, ...transfers.external];

      return Object.values(view).flat();
    },
  };
  private transctns = {
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
      const promises = conids.map((conid) => {
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
          logger.json("IBKR TRNSCTN RAW", t);
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
  };
}
namespace p {
  type events = b.i.transaction_t["type"];
  export type categorised = {
    [key in events]: b.i.transaction_t[];
  };
}
//type view_t = { [key in b.i.transaction_t["type"]]: b.i.transaction_t[] };
//type categorise_t = {
//  [key: number]: view_t;
//};
