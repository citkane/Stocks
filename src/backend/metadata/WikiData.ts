Error.stackTraceLimit = 20;

import { Global } from "@backend/Global";
import { WikiDataApi, type wd } from "@backend/metadata/WikiDataApi";

const P = Promise.all.bind(Promise);

export class WikiData extends Global {
  public location_lookup = async (
    instrmnt: instrmnt_t,
  ): Promise<instrmnt_t> => {
    const { db_insert_locatn, format, db } = this;
    const { hacky_loctn_fix, merge_instrmt_geo } = format;
    instrmnt = { ...instrmnt };
    instrmnt = hacky_loctn_fix(instrmnt);
    Object.freeze(instrmnt);
    const { i_id, place } = instrmnt;

    if (!i_id) throw `[${this.constructor.name}] Instrument i_id required`;
    if (!place) return db_insert_locatn(instrmnt);

    const geo = await db.select.locatn_search(place);
    return geo
      ? merge_instrmt_geo(instrmnt, geo).then(db_insert_locatn)
      : this.enqueue(instrmnt);
  };

  private enqueue = (instrmnt: instrmnt_t) => {
    const { i_id, place: srch_p, country: srch_c } = instrmnt;
    const { db_insrt_geo, db_insert_locatn } = this;
    const { country_search, country, place, region_search, region } = this.find;
    const { merge_instrmt_geo } = this.format;

    return new Promise<instrmnt_t>((resolve, reject) => {
      WikiData.resolvers.set(i_id, () => location_lookup(resolve, reject));
      WikiData.queue.push(i_id);
      this.dequeue();
    });

    async function location_lookup(resolve: resolve_t, reject: reject_t) {
      return await country_search(instrmnt)
        .then((geo?) => country(instrmnt, geo))
        .then((geo) => P([geo, db_insrt_geo("country", geo, srch_c)]))
        .then(([geo]) => place(geo))
        .then(([reg, geo]) => P([reg, geo, db_insrt_geo("place", geo, srch_p)]))
        .then(([regn, geo]) => region_search(regn, geo))
        .then(([regn, geo]) => region(regn, geo))
        .then((geo) => P([geo, db_insrt_geo("region", geo)]))
        .then(([geo]) => merge_instrmt_geo(instrmnt, geo))
        .then(db_insert_locatn)
        .then(resolve)
        .catch((err) => reject(err));
    }
  };
  private dequeue = async () => {
    if (!WikiData.queue.length || WikiData.resolving) return;
    WikiData.resolving = true;
    const i_id = WikiData.queue.shift()!;
    const resolver = WikiData.resolvers.get(i_id)!;
    await resolver().then(() => WikiData.resolvers.delete(i_id));
    WikiData.resolving = false;
    this.dequeue();
  };
  private db_insrt_geo = <T extends wd.convert_key_t>(
    key: T,
    geo: Partial<geo_data_t>,
    search?: string,
  ) => {
    const { geo_to_db } = this.format;
    const { insert } = this.db;
    const db_data = geo_to_db<T>(key, geo, search);

    return insert[`instrmnts_${key}`](db_data as any);
  };
  private db_insert_locatn = async (instrmnt: instrmnt_t) => {
    const { i_id, country_qid, region_qid, place_qid } = instrmnt;
    await this.db.insert.instrmnts_location({
      i_id,
      country_qid,
      region_qid,
      place_qid,
    });
    return instrmnt as instrmnt_t;
  };
  private find = {
    country_search: async (instrmnt: instrmnt_t) => {
      const { country } = instrmnt;
      const { country_search } = this.db.select;
      const { db_to_geo } = this.format;
      return country
        ? country_search(country).then((db_d) => db_to_geo("country", db_d))
        : undefined;
    },
    country: async (instrmnt: instrmnt_t, geo?: Partial<geo_data_t>) => {
      const { country, place } = instrmnt;

      const { fetch_geo_dets } = this;
      const { qid_country, qid_place } = this.find;
      const { resolve_query, merge_geo } = this.format;
      const { request, fetch } = this.api;
      const place_qid = geo
        ? await qid_place(place, geo.country_qid)
        : await qid_country(country).then((c_qid) => qid_place(place, c_qid));
      return geo
        ? merge_geo(geo, { place, place_qid })
        : request
            .country(place_qid)
            .then((req) => fetch<wd.query_t>(req))
            .then((res) => resolve_query(res))
            .then(fetch_geo_dets)
            .then((geo) => merge_geo(geo, { place, place_qid }));
    },
    place: async (geo: Partial<geo_data_t>) => {
      const { country_qid, place_qid } = geo;
      const { fetch_geo_dets } = this;
      const { fetch, request } = this.api;
      const { resolve_query, merge_geo } = this.format;

      return request
        .place_region(place_qid!, country_qid!)
        .then((req) => fetch<wd.query_t>(req))
        .then((res) => resolve_query(res))
        .then(split_plce_regn)
        .then((geo) => P([geo.region, fetch_geo_dets(geo.place)]))
        .then(([regn, p_geo]) => P([regn, merge_geo(geo, p_geo)]));

      function split_plce_regn(geo: Partial<wd.geo_t>): {
        [key in "place" | "region"]: Partial<wd.geo_t>;
      } {
        const {
          place,
          placeLabel,
          placePoint,
          region,
          regionLabel,
          regionPoint,
          regionShape,
        } = geo;
        return {
          place: { place, placeLabel, placePoint },
          region: {
            region,
            regionLabel,
            regionPoint,
            regionShape,
          },
        };
      }
    },
    region_search: (regn: Partial<wd.geo_t>, geo: Partial<geo_data_t>) => {
      const { region: region_qid } = regn;
      const { region } = this.db.select;
      const { merge_geo, db_to_geo } = this.format;
      return region(region_qid)
        .then((db_d) => db_to_geo("region", db_d))
        .then((r_geo) =>
          r_geo ? P([regn, merge_geo(geo, r_geo)]) : P([regn, geo]),
        );
    },
    region: async (
      regn: Partial<wd.geo_t>,
      geo: Partial<geo_data_t>,
    ): Promise<geo_data_t> => {
      if (geo.region_qid) return geo as geo_data_t;

      const { fetch_geo_dets } = this;
      const { merge_geo } = this.format;

      return fetch_geo_dets(regn).then((r_geo) => merge_geo(geo, r_geo));
    },
    qid_country: async (country?: string) => {
      if (!country) return undefined;
      const { is_country } = this.api.wiki.statement;
      const { search } = this;
      return search(country, [is_country()]);
    },
    qid_place: async (place: string, country_qid?: string) => {
      const { in_country, is_place } = this.api.wiki.statement;
      const { search } = this;
      const statement = country_qid
        ? ([in_country(country_qid), is_place()] as string[])
        : ([is_place()] as string[]);
      return (await search(place, statement))!;
    },
    link: async (q_id: string) => {
      const { fetch, request } = this.api;

      const req = request.wiki_links(q_id);
      const res = await fetch<wiki_links_t>(req);
      return this.format.parse_links_res(res, q_id);
    },
    geo_shape: async (url: string) => {
      logger.debug("geo shape:", url);
      const { fetch, request } = this.api;

      const req = request.geo_shape(url);
      const shape = await fetch<Object>(req).catch((err) => {
        logger.error(err);
        return undefined;
      });
      return shape ? JSON.stringify(shape) : undefined;
    },
  };
  private format = {
    resolve_query: (res: wd.query_t) => {
      const geo_data = {} as wd.geo_t;
      const data = res.results.bindings[0];
      if (!data) return geo_data;

      return (Object.keys(data) as wd.geo_key_t[]).reduce((c, key) => {
        let val: string | undefined = data[key].value;
        if (["country", "place", "region"].includes(key)) {
          val = val?.split("/").pop()!;
        }
        if (["placePoint", "regionPoint"].includes(key)) {
          const regex = /Point\(([\d|\-.]+)\s+([\d|\-.]+)\)/;
          const matches = val?.match(regex);
          val = matches ? `${matches[1]},${matches[2]}` : undefined;
        }
        c[key] = val;
        return c;
      }, geo_data);
    },
    parse_links_res: (links: wiki_links_t, q_id: string) => {
      return links.entities[q_id]!.sitelinks.enwiki.url;
    },
    db_to_geo: <T extends wd.convert_key_t>(
      location_key: T,
      data?: db_to_geo_t<T>,
    ) => {
      if (!data) return undefined;

      const keys = ["name", "qid", "geo_shape", "geo_point", "wiki_link"];
      const geo_data = {} as Partial<geo_data_t>;
      return keys.reduce((geo_data, key) => {
        if (!Object.hasOwn(data, key)) return geo_data;

        const val = data[key as keyof typeof data];
        let geo_key: string | undefined;
        switch (key) {
          case "geo_shape":
            geo_key = `${location_key}_shape`;
            break;
          case "geo_point":
            geo_key = `${location_key}_point`;
            break;
          case "wiki_link":
            geo_key = `${location_key}_link`;
            break;
          case "name":
            geo_key = location_key;
            break;
          case "qid":
            geo_key = `${location_key}_qid`;
            break;
          default:
            geo_key = undefined;
        }
        if (!geo_key) return geo_data;

        (geo_data as any)[geo_key] = val;
        return geo_data;
      }, geo_data);
    },
    geo_to_db: <T extends wd.convert_key_t>(
      location_key: T,
      geo_data: Partial<geo_data_t>,
      search?: string,
    ) => {
      const db_data = {} as db_to_geo_t<T>;
      if (["country", "place"].includes(location_key)) {
        (db_data as any).search = search ? [search] : [];
      }
      return Object.keys(geo_data).reduce((db_data, geo_key) => {
        let val = geo_data[geo_key as keyof geo_data_t];
        if (typeof val === "object") val = JSON.stringify(val);
        let key: string | undefined;
        switch (geo_key) {
          case location_key:
            key = "name";
            break;
          case `${location_key}_qid`:
            key = "qid";
            break;
          case `${location_key}_point`:
            key = "geo_point";
            break;
          case `${location_key}_shape`:
            key = "geo_shape";
            break;
          case `${location_key}_link`:
            key = "wiki_link";
            break;
          default:
            key = undefined;
        }
        if (!key) return db_data;
        (db_data as any)[key] = val;
        return db_data;
      }, db_data);
    },
    merge_instrmt_geo: async (
      instrmnt: Partial<instrmnt_t>,
      geo: Partial<geo_data_t>,
    ) => {
      return { ...instrmnt, ...geo } as instrmnt_t;
    },
    merge_geo: <
      T extends Partial<geo_data_t> | geo_data_t = Partial<geo_data_t>,
    >(
      ex_geo: Partial<geo_data_t>,
      add_geo: Partial<geo_data_t>,
    ) => {
      return Object.entries(add_geo).reduce((geo, entry) => {
        const [key, val] = entry as [keyof geo_data_t, any];
        if (!val) return geo;
        geo[key] = val;
        return geo;
      }, ex_geo) as T;
    },
    hacky_loctn_fix: (instrmnt: instrmnt_t) => {
      if (instrmnt.place === "Northlands") instrmnt.place = "Illovo";
      return instrmnt;
    },
  };
  private search = async (
    search_term: string,
    statements: string[],
    limit = 1,
  ) => {
    const { fetch, request } = this.api;
    return request
      .search(search_term, statements, limit)
      .then((req) => fetch<wd.search_t>(req))
      .then((res) => res.query.search[0]?.title || undefined);
  };
  private fetch_geo_dets = async (
    wiki_geo: Partial<wd.geo_t>,
  ): Promise<Partial<geo_data_t>> => {
    const { geo_shape, link } = this.find;
    let {
      country: country_qid,
      region: region_qid,
      place: place_qid,
      countryLabel: country,
      regionLabel: region,
      placeLabel: place,
      placePoint: place_point,
      regionPoint: region_point,
      countryShape: country_shape,
      regionShape: region_shape,
    } = wiki_geo;
    region_shape = region_shape ? await geo_shape(region_shape) : undefined;
    country_shape = country_shape ? await geo_shape(country_shape) : undefined;
    const country_link = country_qid
      ? await await link(country_qid)
      : undefined;
    const region_link = region_qid ? await await link(region_qid) : undefined;
    const place_link = place_qid ? await await link(place_qid) : undefined;

    const geo_data = {
      place,
      region,
      country,
      place_qid,
      country_qid,
      region_qid,
      place_link,
      region_link,
      country_link,
      place_point,
      region_point,
      country_shape,
      region_shape,
    } as Partial<geo_data_t>;

    return Object.keys(geo_data).reduce((data, key) => {
      const val = geo_data[key as keyof geo_data_t];
      if (!val) return data;
      data[key as keyof geo_data_t] = val;
      return data;
    }, {} as Partial<geo_data_t>);
  };
  private api = new WikiDataApi();
  private static queue: i_id_t[] = [];
  private static resolvers = new Map<i_id_t, () => Promise<instrmnt_t>>();
  private static resolving = false;
}

type db_to_geo_t<T extends wd.convert_key_t> = T extends "place"
  ? db.data<"instrument_place">
  : T extends "country"
    ? db.data<"instrument_country">
    : T extends "region"
      ? db.data<"instrument_region">
      :
          | db.data<"instrument_place">
          | db.data<"instrument_country">
          | db.data<"instrument_region">;

type wiki_links_t = {
  entities: {
    [q_id: string]: {
      type: string;
      id: string;
      sitelinks: {
        [name in "enwiki"]: {
          site: string;
          title: string;
          badges: string[];
          url: string;
        };
      };
    };
  };
  success: number;
};
