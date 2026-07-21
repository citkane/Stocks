import { Global } from "@backend/Global";

export class InstrumentsIbkr extends Global {
  public update = () => {
    const { db, postns, frmt } = this;
    return Promise.all([
      db.select
        .accounts(["broker", "ibkr"])
        .then((a) => a.map((a) => a.a_id.split("_")[1]!)),
      db.select
        .instrmnts(["ibkr_id", true], ["ibkr_id"])
        .then((i) => i.map((i) => i.ibkr_id!)),
    ])
      .then(postns.fetch_conids)
      .then((ids) => Promise.all(ids.map(postns.fetch_postns)))
      .then((p) => p.flat())
      .then((p) => p.map(frmt.to_instrmnt));
  };

  private frmt = {
    to_instrmnt: (postn: b.i.positn_t): g.instrmnt => {
      const {
        conid: ibkr_id,
        ticker,
        name: description,
        listingExchange: exchange,
        currency,
        assetClass,
        type,
      } = postn;
      const i_id: id.i = `${exchange}-${ticker}`;
      const asset_class = `${assetClass}-${type}`;

      return {
        ibkr_id: Number(ibkr_id),
        i_id,
        ticker,
        exchange,
        currency,
        description,
        asset_class,
      };
    },
  };

  private postns = {
    fetch_conids: ([acc_ids, ex_postns]: [string[], number[]]) => {
      const { api } = this.ibkr;
      return Promise.all(acc_ids.map(fetch_acc_postns)).then(to_con_ids);

      function fetch_acc_postns(a_id: string) {
        const { url, req_init } = api.get.positions(a_id);
        return api
          .fetch<{ conid: string }[]>(url, req_init)
          .then((p) => [a_id, p] as const);
      }
      function to_con_ids(res: (readonly [string, { conid: string }[]])[]) {
        return res.map(([a_id, p]) => {
          const conids = p
            .map((p) => Number(p.conid))
            .filter((id) => !ex_postns.includes(id));
          return [a_id, conids] as const;
        });
      }
    },
    fetch_postns: ([a_id, conids]: readonly [string, number[]]) => {
      const { postns } = this;
      return Promise.all(conids.map((conid) => postns.fetch_postn(a_id, conid)))
        .then((p) => p.flat())
        .then((p) => {
          logger.json("IBKR POSTN RAW", p);
          return p;
        });
    },
    fetch_postn: (a_id: string, conid: number): Promise<b.i.positn_t[]> => {
      const { postns } = this;
      const { api } = this.ibkr;
      const { url, req_init } = api.get.position(a_id, conid);
      return api
        .fetch<b.i.positn_t[]>(url, req_init)
        .then((p) => postns.audit_positn(a_id, p));
    },
    /* IBKR endpoint does not reliably deliver a full payload, so we pump it */
    audit_positn: async (a_id: string, reslt: b.i.positn_t[]) => {
      const { postns } = this;
      const invalid = reslt.find(
        (postn) =>
          !postn.name ||
          !postn.listingExchange ||
          !postn.type ||
          !postn.assetClass ||
          !postn.ticker,
      );
      return invalid
        ? postns.fetch_postn(a_id, Number(reslt[0]!.conid))
        : reslt;
    },
  };
}
