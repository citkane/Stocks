import { WikiDataApi, type p } from "@backend/metadata/WikiDataApi";
let i = 0;

export class WikiData extends WikiDataApi {
  public location_lookup = async (meta: g.meta) => {
    const { enqueue, cache } = this;
    const { place } = meta;
    if (!place) return cache.resolve(meta);

    await cache.init();
    return enqueue(meta);
  };

  private enqueue = async (meta: g.meta) => {
    const { p_id, place, country } = meta;
    const { find, cache } = this;
    const search: p.search = {
      p_srchd: [place!],
      c_srchd: country ? [place!, country] : [place!],
    };

    return new Promise<wd.result>((resolve, reject) => {
      const id: id.p = `${p_id}_${i++}`;
      WikiData.resolvers.set(id, () => location_lookup(resolve, reject));
      WikiData.queue.push(id);
      this.dequeue();
    });

    async function location_lookup(
      resolve: resolve_t,
      reject: reject_t,
    ): Promise<wd.result> {
      return await find
        .place({ place, country }, search)
        .then((geo) => find.region(geo, search))
        .then((geo) => find.country(geo, search))
        .then((geo) => cache.resolve(meta, geo, search))
        .then(resolve)
        .catch(reject);
    }
  };
  private dequeue = async () => {
    if (!WikiData.queue.length || WikiData.resolving) return;

    WikiData.resolving = true;
    const id = WikiData.queue.shift()!;
    const resolver = WikiData.resolvers.get(id)!;
    await resolver().then(() => WikiData.resolvers.delete(id));
    WikiData.resolving = false;
    this.dequeue();
  };
  private find = {
    place: async (geo: g.meta_geo, search: p.search) => {
      const { cache, get, frmt, find, fetch, request } = this;
      geo = cache.locatn_search(geo, search);
      if (geo.place_link) return geo;

      geo = !geo.country
        ? await find.country(geo, search)
        : await find.qid_place(geo);

      return request
        .place_region(geo.place_qid!, geo.country_qid!)
        .then((req) => fetch<p.res.query>(req))
        .then(frmt.query_res)
        .then((wd_geo) => get.merge_geo_dets(geo, wd_geo))
        .then((geo) => debug(geo, "place"));
    },
    region: async (geo: g.meta_geo, search: p.search) => {
      const { cache, get, frmt, fetch, request, find } = this;
      geo = cache.locatn_search(geo, search);
      if (geo.region_link) return geo;

      geo = !geo.country
        ? await find.country(geo, search)
        : await find.qid_place(geo);

      return request
        .place_region(geo.place_qid!, geo.country_qid!)
        .then((req) => fetch<p.res.query>(req))
        .then(frmt.query_res)
        .then((wd_geo) => get.merge_geo_dets(geo, wd_geo))
        .then((geo) => debug(geo, "region"));
    },
    country: async (geo: g.meta_geo, search: p.search) => {
      const { cache, find, frmt, get, request, fetch } = this;
      geo = cache.locatn_search(geo, search);
      if (geo.country_link) return geo;

      geo = await find.qid_place(geo);

      return request
        .country(geo.place_qid!)
        .then((req) => fetch<p.res.query>(req))
        .then(frmt.query_res)
        .then((wd_geo) => get.merge_geo_dets(geo, wd_geo))
        .then((geo) => debug(geo, "country"));
    },
    qid_place: async (geo: g.meta_geo) => {
      const { get, find } = this,
        { in_country, is_place } = this.wiki.statement;

      geo = await find.qid_country(geo);
      if (geo.place_qid) return geo;

      const statement = geo.country_qid
        ? ([in_country(geo.country_qid), is_place()] as string[])
        : ([is_place()] as string[]);
      const qid = await get.search(geo.place!, statement);
      geo.place_qid = qid ? qid : undefined;

      return this.cache.locatn_search(geo);
    },
    qid_country: async (geo: g.meta_geo) => {
      if (!geo.country || geo.country_qid) return geo;

      const { is_country } = this.wiki.statement;
      const qid = await this.get.search(geo.country, [is_country()]);
      geo.country_qid = qid ? qid : undefined;

      return geo;
    },
    link: async (q_id: string) => {
      const { fetch, request } = this;
      const req = request.wiki_links(q_id);
      const res = await fetch<p.res.links>(req);
      return this.frmt.links_res(res, q_id);
    },
    geo_shape: async (url: string) => {
      const { fetch, request } = this;

      const req = request.geo_shape(url);
      const shape = await fetch<string>(req).catch((err) => {
        logger.error(err);
        return undefined;
      });
      return shape;
    },
  };
  private get = {
    search: async (search_term: string, statements: string[], limit = 1) => {
      const { fetch, request } = this;
      return request
        .search(search_term, statements, limit)
        .then((req) => fetch<p.res.search>(req))
        .then((res) => res.query.search[0]?.title || undefined);
    },
    merge_geo_dets: async (geo: g.meta_geo, wiki: p.raw_geo) => {
      let { find } = this,
        promises: Promise<void>[] = [];

      Object.keys(wiki).forEach((key) => {
        switch (key) {
          case "country":
            if (!wiki.country || geo.country_link) return;
            geo.country_qid = wiki.country;
            mutate_link(wiki.country, "country");
            break;
          case "region":
            if (!wiki.region || geo.region_link) return;
            geo.region_qid = wiki.region;
            mutate_link(wiki.region, "region");
            break;
          case "place":
            if (!wiki.place || geo.place_link) return;
            geo.place_qid = wiki.place;
            mutate_link(wiki.place, "place");
            break;
          case "countryLabel":
            if (!wiki.countryLabel || geo.country) return;
            geo.country = wiki.countryLabel;
            break;
          case "regionLabel":
            if (!wiki.regionLabel || geo.region) return;
            geo.region = wiki.regionLabel;
            break;
          case "placeLabel":
            if (!wiki.placeLabel || geo.place) return;
            geo.place = wiki.placeLabel;
            break;
          case "placePoint":
            if (!wiki.placePoint || geo.place_point) return;
            geo.place_point = JSON.parse(wiki.placePoint);
            break;
          case "regionPoint":
            if (!wiki.regionPoint || geo.region_point) return;
            geo.region_point = JSON.parse(wiki.regionPoint);
            break;
          case "countryShape":
            if (!wiki.countryShape || geo.country_shape) return;
            mutate_shape(wiki.countryShape, "country");
            break;
          case "regionShape":
            if (!wiki.regionShape || geo.region_shape) return;
            mutate_shape(wiki.regionShape, "region");
            break;
        }
      });
      await Promise.all(promises);
      return this.frmt.prune_geo(geo);

      function mutate_link(qid: string, context: p.ctx) {
        promises.push(
          find.link(qid).then((link) => {
            geo[`${context}_link`] = link;
          }),
        );
      }
      function mutate_shape(url: string, context: Exclude<p.ctx, "place">) {
        promises.push(
          find.geo_shape(url).then((shape) => {
            geo[`${context}_shape`] = shape ? JSON.parse(shape) : undefined;
          }),
        );
      }
    },
  };

  private static queue: id.i[] = [];
  private static resolvers = new Map<id.i, () => Promise<wd.result>>();
  private static resolving = false;
}

function debug(geo: g.meta_geo, ctx: string) {
  const { place, place_qid, country, country_qid, region, region_qid } = geo;
  console.debug(`[${ctx.toUpperCase()}]`, {
    place,
    place_qid,
    country,
    country_qid,
    region,
    region_qid,
  });
  return geo;
}
