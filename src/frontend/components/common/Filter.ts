import Cache from "@frontend/Cache";
import { Money } from "./Money";

export class Filter extends Money {
  constructor() {
    super();
  }

  protected get_options = (key: f.filter_key_t): [string, string][] => {
    const root = this.option_tree;
    const {
      broker,
      a_id,
      asset_sector,
      asset_industry,
      country,
      region,
      place,
    } = frontend.cache.filter;

    let options: [string, string][] | undefined = [],
      branch: filter_branch_t | undefined = root,
      paths: string[] = [];

    switch (key) {
      case "broker":
        paths = [asset_sector, asset_industry, country, region, place];
        options = parse_paths(paths, "broker");

        break;
      case "a_id":
        if (broker === "all") {
          options = select("broker");
        } else {
          paths = [
            asset_sector,
            asset_industry,
            country,
            region,
            place,
            broker,
          ];
          options = parse_paths(paths, "a_id");
        }
        break;
      case "asset_sector":
        paths = [broker, a_id, country, region, place];
        options = parse_paths(paths, "asset_sector");
        break;
      case "asset_industry":
        if (asset_sector === "all") {
          options = select("sector");
        } else {
          paths = [broker, a_id, country, region, place, asset_sector];
          options = parse_paths(paths, "asset_industry");
        }
        break;
      case "country":
        paths = [broker, a_id, asset_sector, asset_industry];
        options = parse_paths(paths, "country");
        break;
      case "region":
        if (country === "all") {
          options = select("country");
        } else {
          paths = [broker, a_id, asset_sector, asset_industry, country];
          options = parse_paths(paths, "region");
        }
        break;
      case "place":
        if (region === "all") {
          options = select("region");
        } else {
          paths = [broker, a_id, asset_sector, asset_industry, country, region];
          options = parse_paths(paths, "place");
        }
        break;
    }
    return options || none();

    function select(name: string) {
      return [[`select a ${name}`, "select"]] as [string, string][];
    }
    function none() {
      return [["none", "none"]] as [string, string][];
    }

    function parse_paths(paths: string[], key: f.filter_key_t) {
      paths.forEach((path) => {
        if (path === "all") return;

        branch = branch?.children ? branch!.children[path] : undefined;
      });
      return branch ? parse(branch.options[key]) : undefined;
    }
    function parse(options: Set<option_t>) {
      if (!options.size) return undefined;
      const _options = [...options]
        .map((option) => {
          return option.split("||");
        })
        .sort((a, b) => a[0]!.localeCompare(b[0]!)) as [string, string][];
      _options.unshift(["all", "all"]);
      return _options;
    }
  };
  protected filter = {
    set: (filter: Partial<f.filter_t>) => {
      filter = {
        ...frontend.cache.filter,
        ...filter,
        ...{ search: undefined },
      };
      const props = Object.keys(filter).reduce((c, key) => {
        const _key = key as f.filter_key_t;
        const prop: filter_prop_t = [_key, filter[_key]];
        c.push(prop);
        return c;
      }, [] as filter_prop_t[]);
      return this.filter.handle(...props);
    },
    handle: async (
      ...props: (filter_prop_t | ["search", string | undefined])[]
    ) => {
      props.forEach((prop) => {
        const [key, val] = prop;
        Cache._filter[key] = val!;
      });
      const filter_string = Filter._filter_string;
      await this.selector.root.instrmnts.apply_filter(filter_string);
      this.selector.filter.shown_instrmnts_reset();
      this.selector.filter.selects.forEach((el) => {
        el.setAttribute("data-filter", filter_string);
      });
    },
    init: () => {
      const names = this.selector.filter.selects_names();
      Filter._filter_names = names;
      Cache._filter = Filter.default_filter();
      this.filter.set({});
    },
  };
  private options = {
    make_tree: () => {
      const root = this.filter_branch();
      this.options.reduce_brokers(root);
      return root;
    },
    reduce_brokers: (
      parent_branch: filter_branch_t,
      instrmnt?: instrmnt_t,
      ...breaks: f.filter_key_t[]
    ) => {
      const {
        make_branch,
        add_options,
        reduce_accounts,
        reduce_sectors,
        reduce_countries,
      } = this.options;
      const { transactions } = frontend.cache;
      !!instrmnt
        ? _reduce(parent_branch, instrmnt.i_id)
        : Object.keys(transactions).reduce(_reduce, parent_branch);

      function _reduce(root: filter_branch_t, _i_id: string) {
        const i_id = _i_id as i_id_t;
        const instrmnt = frontend.cache.instruments[i_id]!;
        if (!instrmnt) console.warn(i_id);
        const transctns = transactions[i_id]!;
        const brokers = new Set(transctns.map((t) => t.broker));
        brokers.forEach((broker) => reduce_broker(broker, instrmnt));

        const params = [root, instrmnt, ...breaks] as const;
        if (!breaks.includes("asset_sector")) reduce_sectors(...params);
        if (!breaks.includes("country")) reduce_countries(...params);

        return root;
      }
      function reduce_broker(broker: broker_t, instrmnt: instrmnt_t) {
        let branch = make_branch(parent_branch, broker);
        branch.parent = parent_branch;

        reduce_accounts(branch, broker, instrmnt, "broker", ...breaks);
        const params = [branch, instrmnt, "broker", ...breaks] as const;
        if (!breaks.includes("asset_sector")) reduce_sectors(...params);
        if (!breaks.includes("country")) reduce_countries(...params);

        add_options(branch, instrmnt, { _broker: broker });
      }
    },
    reduce_accounts: (
      parent_branch: filter_branch_t,
      broker: broker_t,
      instrmnt: instrmnt_t,
      ...breaks: f.filter_key_t[]
    ) => {
      breaks.push("a_id");
      const { add_options, make_branch, reduce_sectors, reduce_countries } =
        this.options;

      accounts().reduce((parent_branch, acc) => {
        const [broker_a_id] = acc;
        if (!has_transactions(broker_a_id)) return parent_branch;

        const { a_id } = a_id_alias(acc);
        let branch = make_branch(parent_branch, a_id);
        branch.parent = parent_branch;

        const params = [branch, instrmnt, ...breaks] as const;
        if (!breaks.includes("asset_sector")) reduce_sectors(...params);
        if (!breaks.includes("country")) reduce_countries(...params);

        add_options(branch, instrmnt, { _account: option(acc) });

        return parent_branch;
      }, parent_branch);

      function has_transactions(a_id: string) {
        //if (!instrmnt) return false;
        const { transactions } = frontend.cache;
        //console.log({ instrmnt });
        const transctns = transactions[instrmnt.i_id]!;
        return !!transctns.find((t) => a_id === `${broker}_${t.a_id}`);
      }
      function accounts() {
        return frontend.cache.get
          .accounts(broker)
          .map((a) => [a.a_id, a.alias]) as [string, string?][];
      }
      function option(acc: [string, string?]) {
        const { alias, a_id } = a_id_alias(acc);
        return `${alias}||${a_id}` as option_t;
      }
      function a_id_alias(acc: [string, string?]) {
        let [a_id, alias] = acc;
        a_id = a_id?.split("_")[1]!;
        alias = alias || a_id;
        return { a_id, alias };
      }
    },
    reduce_sectors: (
      parent_branch: filter_branch_t,
      instrmnt: instrmnt_t,
      ...breaks: f.filter_key_t[]
    ) => {
      const { asset_sector } = instrmnt;
      if (!asset_sector) return;

      const {
        make_branch,
        reduce_industries,
        reduce_countries,
        reduce_brokers,
      } = this.options;
      breaks.push("asset_sector");
      let branch = make_branch(parent_branch, asset_sector);
      branch.parent = parent_branch;
      reduce_industries(branch, instrmnt, ...breaks);

      const params = [branch, instrmnt, ...breaks] as const;
      if (!breaks.includes("broker")) reduce_brokers(...params);
      if (!breaks.includes("country")) reduce_countries(...params);

      this.options.add_options(branch, instrmnt, { _sector: true });
    },
    reduce_industries: (
      parent_branch: filter_branch_t,
      instrmnt: instrmnt_t,
      ...breaks: f.filter_key_t[]
    ) => {
      breaks.push("asset_industry");
      const { make_branch, add_options, reduce_countries, reduce_brokers } =
        this.options;

      const { asset_industry } = instrmnt;
      const branch = make_branch(parent_branch, asset_industry!);
      branch.parent = parent_branch;

      const params = [branch, instrmnt, ...breaks] as const;
      if (!breaks.includes("broker")) reduce_brokers(...params);
      if (!breaks.includes("country")) reduce_countries(...params);

      add_options(branch, instrmnt, { _industry: true });
    },
    reduce_countries: (
      parent_branch: filter_branch_t,
      instrmnt: instrmnt_t,
      ...breaks: f.filter_key_t[]
    ) => {
      const { country_qid } = instrmnt;
      if (!country_qid) return;

      breaks.push("country");
      const { make_branch, reduce_regions, reduce_sectors, reduce_brokers } =
        this.options;
      let branch = make_branch(parent_branch, country_qid);
      branch.parent = parent_branch;

      const params = [branch, instrmnt, ...breaks] as const;
      reduce_regions(...params);
      if (!breaks.includes("broker")) reduce_brokers(...params);
      if (!breaks.includes("asset_sector")) reduce_sectors(...params);

      this.options.add_options(branch, instrmnt, { _country: true });
    },
    reduce_regions: (
      parent_branch: filter_branch_t,
      instrmnt: instrmnt_t,
      ...breaks: f.filter_key_t[]
    ) => {
      breaks.push("region");
      const { make_branch, reduce_places, reduce_sectors, reduce_brokers } =
        this.options;
      const { region_qid } = instrmnt;
      const branch = make_branch(parent_branch, region_qid);
      branch.parent = parent_branch;

      const params = [branch, instrmnt, ...breaks] as const;
      reduce_places(...params);
      if (!breaks.includes("broker")) reduce_brokers(...params);
      if (!breaks.includes("asset_sector")) reduce_sectors(...params);

      this.options.add_options(branch, instrmnt, { _region: true });
    },
    reduce_places: (
      parent_branch: filter_branch_t,
      instrmnt: instrmnt_t,
      ...breaks: f.filter_key_t[]
    ) => {
      breaks.push("place");
      const { make_branch, reduce_sectors, reduce_brokers } = this.options;
      const { place_qid } = instrmnt;
      const branch = make_branch(parent_branch, place_qid);
      branch.parent = parent_branch;

      const params = [branch, instrmnt, ...breaks] as const;
      if (!breaks.includes("broker")) reduce_brokers(...params);
      if (!breaks.includes("asset_sector")) reduce_sectors(...params);

      this.options.add_options(branch, instrmnt, { _place: true });
    },
    make_branch: (parent: filter_branch_t, key: string) => {
      if (!parent.children) parent.children = {};
      if (!parent.children[key]) parent.children[key] = this.filter_branch();
      return parent.children[key];
    },
    add_options: (
      branch: filter_branch_t,
      instrmnt: instrmnt_t,
      props: add_option_p,
    ) => {
      const {
        _broker,
        _industry,
        _sector,
        _country,
        _region,
        _place,
        _account,
      } = props;
      const {
        asset_sector,
        asset_industry,
        country,
        country_qid,
        region,
        region_qid,
        place,
        place_qid,
      } = instrmnt;

      if (_sector && !!asset_sector) {
        const option = `${asset_sector}||${asset_sector}` as option_t;
        add_option(branch, option, "asset_sector");
      }
      if (_industry) {
        const option = `${asset_industry}||${asset_industry}` as option_t;
        add_option(branch, option, "asset_industry");
      }
      if (_country && !!country_qid) {
        const option = `${country}||${country_qid}` as option_t;
        add_option(branch, option, "country");
      }
      if (_region) {
        const option = `${region}||${region_qid}` as option_t;
        add_option(branch, option, "region");
      }
      if (_place) {
        const option = `${place}||${place_qid}` as option_t;
        add_option(branch, option, "place");
      }
      if (!!_broker) {
        const option = `${_broker}||${_broker}` as option_t;
        add_option(branch, option, "broker");
      }
      if (!!_account) {
        const option = _account;
        add_option(branch, option, "a_id");
      }

      function add_option(
        branch: filter_branch_t,
        option: option_t,
        key: keyof filter_branch_t["options"],
      ) {
        branch.options[key].add(option);
        if (branch.parent) add_option(branch.parent, option, key);
      }
    },
  };

  protected get filter_str() {
    return Filter._filter_string;
  }
  private filter_branch = () => {
    return {
      options: {
        broker: new Set(),
        a_id: new Set(),
        asset_sector: new Set(),
        asset_industry: new Set(),
        country: new Set(),
        region: new Set(),
        place: new Set(),
      },
    } as Partial<filter_branch_t> as filter_branch_t;
  };

  public static default_filter() {
    return this._filter_names.reduce((c, key) => {
      if (key === "search") {
        c[key] = undefined;
        return c;
      }
      c[key as f.filter_key_t] = "all";
      return c;
    }, {} as f.filter_t);
  }
  private static get _filter_string() {
    return util.html.json_stringify(Cache._filter);
  }
  private get option_tree() {
    if (Filter._option_tree) return Filter._option_tree;
    return (Filter._option_tree = this.options.make_tree());
  }
  private static _filter_names: string[] = [];
  private static _option_tree?: filter_branch_t;
}

declare global {
  namespace f {
    type filter_key_t =
      | "broker"
      | "a_id"
      | "asset_sector"
      | "asset_industry"
      | "country"
      | "region"
      | "place";
    type filter_t = { [key in filter_key_t]: string } & {
      search: string | undefined;
    };
  }
}
type filter_prop_t = [f.filter_key_t, string | undefined];
type filter_options_t = {
  [key in f.filter_key_t]: Set<option_t>;
};
type option_t = `${string}||${string}`;
type filter_branch_t = {
  options: filter_options_t;
  parent?: filter_branch_t;
  children?: { [key: string]: filter_branch_t };
};
type add_option_p = {
  _broker?: broker_t;
  _industry?: boolean;
  _sector?: boolean;
  _country?: boolean;
  _region?: boolean;
  _place?: boolean;
  _account?: option_t;
};
