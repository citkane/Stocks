import Cache from "@frontend/Cache";
import { WebComponent } from "@frontend/components/WebComponent";

export class FilterRoot extends WebComponent {
  static observedAttributes = ["positns"];

  constructor() {
    super();
    this.dom.template_to_self("filter-root");
    this.props.watch("positns", this.handlers.render);
  }
  public set = (filter: filter.data) => {
    console.log({ filter });
    Object.entries(filter).forEach(([key, val]) => {
      Cache.filter[key as filter.key] = val;
    });
    this.dom.set_options();
    const filter_hash = util.hash_id(Cache.filter);
    this.el.root_app.setAttribute("filter", filter_hash);
  };
  public default = (): filter.data => ({
    broker: "all",
    a_id: "none",
    asset_sector: "all",
    asset_industry: "none",
    country_qid: "all",
    region_qid: "none",
    place_qid: "none",
  });
  private handlers = {
    render: (p: pr.prop_callback) => {
      if (p.old === p.new) return;
      const { dom, el, handlers } = this;
      delete self.selection_paths;
      dom.set_options();
      if (p.old) return;

      Object.keys(Cache.filter).forEach((key) => {
        el[key as filter.key].onchange = handlers.select;
      });
    },
    select: (e: Event) => {
      const el = e.target as HTMLSelectElement;
      const val = el.value;
      const key = el.name as keyof filter.data;
      if (Cache.filter[key] === val) return;

      Cache.filter[key] = val;
      if (key === "broker") {
        Cache.filter.a_id = val === "all" ? "none" : "all";
      }
      if (key === "asset_sector") {
        Cache.filter.asset_industry = val === "all" ? "none" : "all";
      }
      if (key === "country_qid") {
        Cache.filter.region_qid = val === "all" ? "none" : "all";
        Cache.filter.place_qid = "none";
      }
      if (key === "region_qid") {
        Cache.filter.place_qid = val === "all" ? "none" : "all";
      }
      this.set(Cache.filter);
    },
  };
  private dom = this.api.dom({
    set_options: () => {
      const { dom, cache } = this;
      const { opt } = dom;
      const { country: c, place: p, region: r } = cache.get;
      const { broker, a_id, sector, industry: ind } = this.option_keys,
        { country_qid: cq, region_qid: rq, place_qid: pq } = this.option_keys;
      const a = accnt_keys();
      const all_opts = {
        broker: [broker.map((k) => opt([k, k])), ["brokers", "broker"]],
        a_id: [a_id.map((k) => opt([k, a[k]!])), ["accounts", "broker"]],
        asset_sector: [sector.map((k) => opt([k, k])), ["sectors", "sector"]],
        asset_industry: [ind.map((k) => opt([k, k])), ["industries", "sector"]],
        country_qid: [cq.map((k) => opt([k, c(k)!])), ["countries", "country"]],
        region_qid: [rq.map((k) => opt([k, r(k)!])), ["regions", "country"]],
        place_qid: [pq.map((k) => opt([k, p(k)!])), ["places", "region"]],
      } as const;

      Object.entries(all_opts).forEach(([sel_name, [opts, labels]]) => {
        const key = sel_name as keyof filter.data,
          el = this.el[key],
          filter_val = Cache.filter[key];

        el.innerHTML = "";
        el.disabled = false;
        if (opts.length) {
          opts.sort((a, b) => a.innerText.localeCompare(b.innerText));
          opts.unshift(dom.opt(["all", `All ${labels[0]}`]));
          opts.forEach((o) => el.appendChild(o));
          el.value = filter_val === "none" ? "all" : filter_val;
        } else {
          const opt = dom.opt(["none", `Select ${labels[1]}`]);
          el.appendChild(opt);
          el.disabled = true;
          Cache.filter[key] = "none";
          el.value = "none";
        }
      });

      function accnt_keys() {
        //console.log(a_id, cache.filter.broker);
        const accnts = cache.get.accnts();
        const keys = {} as { [id: string]: string };
        return broker.reduce((accs, broker) => {
          //console.log(broker);
          const a = accnts[broker as g.broker];
          if (!a) return accs;
          Object.entries(a).forEach(([id, acc]) => {
            accs[id] = acc.alias || id;
          });
          return accs;
        }, keys);
      }
    },
    opt: ([val, key]: [string, string]) => {
      return this.dom.make_el<HTMLOptionElement>(
        "option",
        `${key}`,
        `value="${val}"`,
      );
    },
  });
  private props = this.api.props();
  private el = this.query.select<{
    a_id: HTMLSelectElement;
    broker: HTMLSelectElement;
    asset_sector: HTMLSelectElement;
    asset_industry: HTMLSelectElement;
    place_qid: HTMLSelectElement;
    region_qid: HTMLSelectElement;
    country_qid: HTMLSelectElement;
    search: HTMLInputElement;
  }>({
    a_id: ["qs", `select[name="a_id"]`],
    broker: ["qs", `select[name="broker"]`],
    asset_sector: ["qs", `select[name="asset_sector"]`],
    asset_industry: ["qs", `select[name="asset_industry"]`],
    place_qid: ["qs", `select[name="place_qid"]`],
    region_qid: ["qs", `select[name="region_qid"]`],
    country_qid: ["qs", `select[name="country_qid"]`],
    search: ["qs", `select[name="search"]`],
  });

  private get option_keys() {
    let path = structuredClone(this.make_paths());
    const f = this.cache.filter;

    if (f.asset_sector) path = path.asset_sector![f.asset_sector]!;
    if (f.country_qid) path = path.country_qid![f.country_qid]!;
    if (f.broker) path = path.broker![f.broker]!;
    if (f.asset_industry) path = path.asset_industry![f.asset_industry]!;
    if (f.region_qid) path = path.region_qid![f.region_qid]!;
    if (f.a_id) path = path.a_id![f.a_id]!;
    if (f.place_qid) path = path.place_qid![f.place_qid]!;

    return {
      broker: extract(path, "broker"),
      a_id: extract(path, "a_id"),
      sector: extract(path, "asset_sector"),
      industry: extract(path, "asset_industry"),
      country_qid: extract(path, "country_qid"),
      region_qid: extract(path, "region_qid"),
      place_qid: extract(path, "place_qid"),
    };

    function extract(path: p.path, key: keyof filter.data): string[] {
      let base = path[key];
      if (!base) return path.parent ? extract(path.parent, key) : [];
      return Object.keys(base);
    }
  }

  private make_paths = () => {
    if (self.selection_paths) return self.selection_paths;

    const { cache } = this;
    const positns = cache.get.positns();
    const instrmnts = cache.get.instrmnts();
    const path = empty_path();

    return (self.selection_paths = Object.values(instrmnts).reduce(
      (path, instrmnt) => {
        const { asset_sector, asset_industry, p_id } = instrmnt;
        const { country_qid, region_qid, place_qid } = instrmnt.geo;

        positns[p_id]!.transctns.forEach((t) => {
          const filter: Partial<filter.data> = {
            broker: t.broker,
            a_id: t.a_id,
            asset_sector,
            asset_industry,
            country_qid,
            region_qid,
            place_qid,
          };
          build_paths(path, filter);
        });
        return path;
      },
      path,
    ));

    function build_paths(path: p.path, f: Partial<filter.data>) {
      if (f.broker) delete path.a_id;
      if (f.asset_sector) delete path.asset_industry;
      if (f.country_qid) delete path.region_qid;
      if (f.region_qid) delete path.place_qid;

      if (f.broker) {
        build("broker", prune(f, "broker"));
      }
      if (f.a_id && !f.broker) {
        build("a_id", prune(f, "a_id", "broker"));
      }
      if (f.asset_sector) {
        build("asset_sector", prune(f, "asset_sector"));
      }
      if (f.asset_industry && !f.asset_sector) {
        build("asset_industry", prune(f, "sector", "asset_industry"));
      }
      if (f.country_qid) {
        build("country_qid", prune(f, "country_qid"));
      }
      if (f.region_qid && !f.country_qid) {
        build("region_qid", prune(f, "ctry_qid", "region_qid"));
      }
      if (f.place_qid && !f.region_qid) {
        build("place_qid", prune(f, "country_qid", "region_qid", "place_qid"));
      }

      function build(key: keyof filter.data, f_path: Partial<filter.data>) {
        path[key]![f[key]!] ??= make_branch(f_path, path);
        const branch = path[key]![f[key]!]!;
        build_paths(branch, f_path);
      }
    }
    function empty_path(): p.path {
      return {
        broker: {},
        a_id: {},
        asset_sector: {},
        asset_industry: {},
        country_qid: {},
        region_qid: {},
        place_qid: {},
      };
    }
    function make_branch(filter: Partial<filter.data>, parent: p.path): p.path {
      const path = Object.fromEntries(
        Object.entries(filter).map(([k]) => [k, {} as p.path]),
      );
      path.parent = parent || {};
      return path;
    }
    function prune<T>(obj: T extends Object ? T : never, ...f: string[]): T {
      return Object.fromEntries(
        Object.entries(obj).filter(([k]) => !f.includes(k)),
      ) as T;
    }
  };
  private static selection_paths?: p.path;
}
const self = FilterRoot;

declare global {
  namespace filter {
    type key =
      | "broker"
      | "a_id"
      | "asset_sector"
      | "asset_industry"
      | "country_qid"
      | "region_qid"
      | "place_qid";
    type data = { [key in filter.key]: string };
  }
}
namespace p {
  export type path = {
    [key in keyof filter.data | "parent"]?: {
      [key: string]: path;
    };
  };
}
