import { Global } from "@backend/Global";

export class Cache extends Global {
  public get a_ids() {
    return this.brokers.cache.accounts
      .then((accs) =>
        accs.filter((a) => a.broker === "saxo").map((a) => a.a_id_original),
      )
      .then((a_ids) => {
        if (!a_ids.length) throw Error(err_m("accounts"));
        return a_ids;
      });
  }

  public get uics() {
    if (!this.positn_map) throw Error(err_m("positions"));
    return [...this.positn_map.keys()];
  }

  public position = (uic: number) => {
    if (!this.positn_map) throw Error(err_m("positions"));
    return this.positn_map.get(String(uic));
  };

  public set positions(positns: { [p_id: p_id_t]: b.positn_t }) {
    if (!this.positn_map) this.positn_map = new Map();
    Object.values(positns).forEach((positn) => {
      const p_id = positn.p_ids[0]!;
      const uic = p_id.split("_")[1]!;
      this.positn_map!.set(uic, positn);
    });
    this.brokers.cache.positions = positns;
  }

  private positn_map?: Map<string, b.positn_t>;
}

function err_m(subject: string) {
  return `SAXO ${subject} must be set before proceeding`;
}
