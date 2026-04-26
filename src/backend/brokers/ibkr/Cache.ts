import { Global } from "@backend/Global";

export class Cache extends Global {
  public get a_ids() {
    return this.brokers.cache.accounts
      .then((accs) =>
        accs.filter((a) => a.broker === "ibkr").map((a) => a.a_id_original),
      )
      .then((a_ids) => {
        if (!a_ids.length) throw Error(err_m("accounts"));
        return a_ids;
      });
  }
  public get conids() {
    if (!this.positn_map) throw Error(err_m("positions"));
    return [...this.positn_map.keys()];
  }

  public position = (conid: number) => {
    if (!this.positn_map) throw Error(err_m("positions"));
    return this.positn_map.get(String(conid));
  };

  public set positions(positns: { [p_id: p_id_t]: b.positn_t }) {
    if (!this.positn_map) this.positn_map = new Map();
    Object.values(positns).forEach((positn) => {
      const p_id = positn.p_ids[0]!;
      const conid = p_id.split("_")[1]!;
      this.positn_map!.set(conid, positn);
    });
    this.brokers.cache.positions = positns;
  }

  private positn_map?: Map<string, b.positn_t>;
}

function err_m(subject: string) {
  return `IBKR ${subject} must be set before proceeding`;
}
