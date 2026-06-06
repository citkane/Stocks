import { Filter } from "@frontend/components";

export class InsightCollector {
  constructor(
    public topic: string,
    private name: string,
  ) {}

  public market_value = 0;
  public u_pl = 0;
  public u_pl_perc = 0;
  public traded_value = 0;
  public to_collect: (InsightCollector | InsightBranch)[] = [];
  public parent?: InsightCollector;
  public collect = (parent?: InsightCollector) => {
    this.parent = parent;
    this.to_collect.forEach((child) => child.collect(this));
    const { traded_value, market_value, u_pl } = this;
    this.u_pl_perc = util.money.percent_pl(traded_value, market_value);
    this.pl_high_low = this.u_pl_perc;

    if (!this.parent) return;

    this.parent.traded_value += traded_value;
    this.parent.market_value += market_value;
    this.parent.u_pl += u_pl;
  };
  public set_filter = (
    keys: f.insight_key_t[],
    index: number,
    instrmnt: instrmnt_t,
  ) => {
    keys = keys.slice(0, index + 1);
    keys.forEach((key) => {
      let i_key = key as keyof instrmnt_t;
      if (["country", "region", "place"].includes(key)) {
        i_key = `${key}_qid` as keyof instrmnt_t;
        const l_key = `${key}_link` as keyof instrmnt_t;
        this.location_link = String(instrmnt[l_key] || "");
      }
      const i_value = String(instrmnt[i_key]!);
      this.filter[key] = i_value;
    });
  };
  public get row_data() {
    const {
      market_value,
      traded_value,
      u_pl,
      u_pl_perc,
      topic,
      filter,
      location_link,
    } = this;
    const { high: u_pl_high, low: u_pl_low } =
      InsightCollector.pl_high_low[this.name]!;
    return {
      topic,
      root_value: this.parent?.market_value || this.market_value,
      market_value,
      traded_value,
      u_pl,
      u_pl_perc,
      u_pl_high,
      u_pl_low,
      filter,
      location_link,
    };
  }
  private set pl_high_low(u_pl: number) {
    const { pl_high_low } = InsightCollector;
    if (!pl_high_low[this.name]) pl_high_low[this.name] = { high: 0, low: 0 };
    const high_low = pl_high_low[this.name]!;
    if (u_pl < high_low.low) high_low.low = u_pl;
    if (u_pl > high_low.high) high_low.high = u_pl;
  }
  public filter = Filter.default_filter();
  private location_link?: string;
  private static pl_high_low = {} as {
    [name: string]: { high: number; low: number };
  };
}
export class InsightBranch extends InsightCollector {
  constructor(topic: string, name: string) {
    super(topic, name);
  }
  public append = (
    key: f.insight_key_t,
    topic: string,
    child: InsightBranch | InsightCollector,
  ) => {
    if (!this[key]) this[key] = {};
    this.to_collect.push(child);
    this[key][topic] = child;
  };

  public asset_sector?: { [key: string]: InsightBranch | InsightCollector };
  public asset_industry?: { [key: string]: InsightBranch | InsightCollector };
  public country?: { [key: string]: InsightBranch | InsightCollector };
  public region?: { [key: string]: InsightBranch | InsightCollector };
  public place?: { [key: string]: InsightBranch | InsightCollector };
}
export class InsightData {
  constructor(...keys: f.insight_key_t[]) {
    this.keys = keys;
    this.root = this.empty_branch<"root">();
    this.instrmnts.reduce((root, instrmnt) => {
      this.make_branches<"root">(instrmnt, root);
      return root;
    }, this.root);
  }

  public root: structured_data_t<"root">;
  public static data_type<T extends "root" | "branch" | "leaf">(
    data: structured_data_leaf_t<any> | structured_data_t<any>,
  ) {
    return data as structured_data_leaf_t<T>;
  }

  private make_branches<T extends "branch" | "leaf" | "root">(
    instrmnt: instrmnt_t,
    branch: structured_data_t<T>,
    index = 0,
  ): void {
    const key = this.keys[index]!;
    const _key = instrmnt[key];
    if (!_key) return;

    const is_leaf = index === this.keys.length - 1;
    if (is_leaf) {
      const _branch = branch as unknown as structured_data_t<"leaf">;
      if (!_branch.children[_key])
        _branch.children[_key] = { instrmnt, children: [] };
      _branch.children[_key]!.children.push(instrmnt);
      return;
    }
    const _branch = branch as unknown as structured_data_t<"branch">;
    if (!_branch.children[_key])
      _branch.children[_key] = this.empty_branch<"branch">(instrmnt, _branch);
    return this.make_branches(instrmnt, _branch.children[_key], index + 1);
  }

  private empty_branch = <T extends "branch" | "leaf" | "root" = "branch">(
    instrmnt?: instrmnt_t,
    parent?: structured_data_t,
  ) => {
    return { parent, instrmnt, children: {} } as structured_data_t<T>;
  };

  private get instrmnts() {
    return Object.values(frontend.cache.instruments);
  }
  private keys: f.insight_key_t[];
}

type structured_data_leaf_t<T extends "branch" | "leaf" | "root"> =
  T extends "leaf"
    ? { instrmnt: instrmnt_t; children: instrmnt_t[] }
    : structured_data_t<"branch">;
type structured_data_t<T extends "branch" | "leaf" | "root" = "branch"> =
  T extends "branch" | "leaf"
    ? {
        instrmnt: instrmnt_t;
        parent?: structured_data_t;
        children: { [topic: string]: structured_data_leaf_t<T> };
      }
    : {
        children: { [topic: string]: structured_data_leaf_t<"branch"> };
      };
