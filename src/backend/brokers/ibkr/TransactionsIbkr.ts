import { Global } from "@backend/Global";

export class TransactionsIbkr extends Global {
  public async update(acc_ids: string[], con_ids: string[], days_ago: number) {
    const curr = this.base_currency;
    const p = { acc_ids, con_ids, curr, days_ago };

    return this.transactions
      .fetch(p)
      .then((t) => logger.json("IBKR transactions raw", t))
      .then(this.transactions.categorise)
      .then(this.transactions.transform);
  }
  public transctns_update_date = async () => {
    let last_date = await this.db.select.transctns_update_date("ibkr");
    const days_ago = last_date
      ? util.time.aging_days(last_date)
      : util.time.aging_days(conf.ibkr.start_date);
    return days_ago + 1;
  };

  private transactions = {
    fetch: async (p: b.i.transactions_p) => {
      fetch_fn.bind(this);
      const promises = p.con_ids.reduce(
        (c, conid) => {
          const try_fetch = fetch_fn.bind(this)(conid);
          const transactions = try_fetch()
            .catch(() => {
              const err_mess = `Failed to fetch IBKR transactions for ${conid}`;
              throw err_mess;
              //return this.ibkr.retry_fetch<b.i.transactions_t>(
              //  try_fetch,
              //  err_mess,
              //);
            })
            .then((data) => (data.transactions ? data.transactions : []));

          c.push(transactions);
          return c;
        },
        [] as Promise<b.i.transaction_t[]>[],
      );

      const transctns = await Promise.all(promises).then((transactions) =>
        transactions.flat(),
      );
      return transctns;

      function fetch_fn(this: TransactionsIbkr, conid: string) {
        const { post, fetch } = this.ibkr.api;
        const _p = { ...p, ...{ con_ids: [conid] } };
        const { url, req_init } = post.transactions(_p);
        return () => {
          const fetcher = fetch<b.i.transactions_t>(url, req_init);
          _p.days_ago++;
          return fetcher;
        };
      }
    },
    /**
     * Reduce an array of transactions into categorised arrays,
     * keyed by conid and then by type
     */
    categorise: (transactions: b.i.transaction_t[]) => {
      return transactions.reduce((c, transaction) => {
        const { type, conid } = transaction;

        if (!c[conid]) c[conid] = {} as categorise_t[typeof conid];
        if (!c[conid][type]) c[conid][type] = [];
        if (!transaction.isRealTime) c[conid][type].push(transaction);

        return c;
      }, {} as categorise_t);
    },
    /**
     * Transforms IBKR transactions to the normalised frontend transaction type.
     */
    transform: async (transactions: categorise_t) => {
      return Object.keys(transactions).reduce((c, conid) => {
        const categorised = transactions[conid as any]!;
        const {
          Buy,
          Sell,
          "Dividend Payment": dividends,
        } = this.transactions.transfer(categorised);

        [...(Buy || []), ...(Sell || []), ...(dividends || [])].forEach(
          (tr) => {
            let transaction = this.transactions.format(tr);
            c.push(transaction);
          },
        );
        return c;
      }, [] as transctn_t[]);
    },
    format: (transaction: b.i.transaction_t): transctn_t => {
      let {
        conid,
        acctid: a_id,
        cur: currency,
        qty: amount,
        pr: price_traded,
        fxRate: fx_traded,
        date: date_string,
        amt,
        type,
      } = transaction;
      let positn = this.ibkr.cache.get.position(conid);
      if (!positn) {
        logger.error("No position found for transaction", "ibkr", conid);
        positn = {
          i_id: `undefined-undefined`,
        } as unknown as b.positn_t;
      }
      const { i_id } = positn;
      const date = util.time.ms(date_string);
      const id = this.transactions.uid(transaction);
      const broker = "ibkr";
      const p_id: p_id_t = `${broker}_${conid}`;
      let kind: transctn_t["kind"];
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

      if (kind === "dividend") {
        amount = 1;
        price_traded = amt / fx_traded;
      }

      return {
        id,
        p_id,
        a_id,
        i_id,
        broker,
        currency,
        amount: amount!,
        price_traded: price_traded!,
        fx_traded,
        date,
        kind,
        //exchange,
        //ticker,
      };
    },
    /** Create a unque id for the given transactions */
    uid: (transaction: b.i.transaction_t) => {
      const string = Object.keys(transaction)
        .map((key) => transaction[key as keyof typeof transaction])
        .join("");
      const hasher = new Bun.CryptoHasher("md5");
      hasher.update(string);
      return hasher.digest("hex");
    },
    /** Identifies external transfers in and converts them to buy.
     *  Maps transfer account ids to buys.*/
    transfer: (view: view_t) => {
      let { Transfer, Buy } = view;
      if (!Transfer) return view;
      if (!Buy) Buy = [];
      const transfers = Transfer.sort((a, b) =>
        b.rawDate.localeCompare(a.rawDate),
      )
        .map((transfer) => {
          let { desc, amt, rawDate, fxRate } = transfer;

          const kind = amt! > 0 ? "in" : "out";
          const qty = Number(desc.split("Quantity: ")[1]!.replaceAll(",", ""));
          let pr = Math.round(util.money.whole(amt / fxRate) / qty);
          pr = pr / 100;

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
          (c, transfer) => {
            const { kind } = transfer;
            c[kind as keyof typeof c].push(transfer);
            return c;
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

      return view;
    },
  };
}

type view_t = { [key in b.i.transaction_t["type"]]: b.i.transaction_t[] };
type categorise_t = {
  [key: number]: view_t;
};
