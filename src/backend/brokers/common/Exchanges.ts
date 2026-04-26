import { Global } from "@backend/Global";
import { default as ibkr_to_tv } from "./mapping/ibkr_to_tv.json";
import { default as saxo_to_tv } from "./mapping/saxo_to_tv.json";

const uris = {
  iso_mic: "iso20022.org/sites/default/files/ISO10383_MIC/ISO10383_MIC.csv",
  trading_view: "tradingviewapi.com/data/complete-api-mapping.json",
  ibkr: "interactivebrokers.com/webrest/exchanges",
};

export class Exchanges extends Global {
  constructor() {
    super();
  }

  protected get tv_exchange_map() {
    if (!!this._tv_exchange_map) return this._tv_exchange_map;

    this._tv_exchange_map = {
      saxo: this.map_to_tv_mic(saxo_to_tv),
      ibkr: this.map_to_tv_mic(ibkr_to_tv),
    } as b.exchg_map_t;

    //logger.json("TV exchanges map", this.tv_exchange_map);
    return this._tv_exchange_map;
  }
  private _tv_exchange_map?: b.exchg_map_t;

  public update = async () => {
    const [tv_exchgs, saxo_exchgs, ibkr_exchgs, mic_exchgs] = await Promise.all(
      [
        this.tv_ex.fetch().then(this.tv_ex.exchgs),
        this.saxo.fetch_exchanges().then(this.saxo_ex.exchgs),
        this.ibkr_ex.fetch().then(this.ibkr_ex.exchgs),
        this.mic_ex.fetch().then(this.mic_ex.exchgs),
      ],
    );

    //logger.json("MIC exchanges", mic_exchgs);
    //logger.json("IBKR exchanges", ibkr_exchgs);
    //logger.json("TV exchanges", tv_exchgs);
    //logger.json("SAXO exchanges", saxo_exchgs);

    const verify_ibkr = this.ibkr_ex.verify(tv_exchgs, ibkr_exchgs, mic_exchgs);
    //logger.json("IBKR exchanges verify", verify_ibkr);

    const verify_saxo = this.saxo_ex.verify(tv_exchgs, saxo_exchgs, mic_exchgs);
    //logger.json("SAXO exchanges verify", verify_saxo);
  };

  private map_to_tv_mic = <T extends typeof ibkr_to_tv | typeof saxo_to_tv>(
    mapping: T,
  ) => {
    return Object.keys(mapping).reduce(
      (c, key) => {
        const val = mapping[key as keyof T];

        let { id: tv, mic } = val as { id: string; mic: string };
        c[key] = { tv: tv || null, mic: mic || null };

        return c;
      },
      {} as { [key: string]: { mic: string | null; tv: string | null } },
    );
  };

  private tv_ex = {
    fetch: () =>
      this.fetch(uris.trading_view)
        .then((res) => res.json())
        .then((data: tv_data_t) => data.exchanges.exchanges),
    exchgs: (exchgs_raw: tv_echg_t[]) => {
      return this.tv_ex.filter(exchgs_raw).reduce(
        (c, ex) => {
          let { value: tv_id, desc, country } = ex;
          country = util.string.country(country);
          const key = `${tv_id}.${country}`;
          c[key] = { tv_id, desc, country };
          return c;
        },
        {} as { [key: string]: exchg_t },
      );
    },
    filter: (exchgs_raw: tv_echg_t[]) => {
      const banned = [" indices", " futures", " indexes", "index series"];
      return exchgs_raw.filter((ex) => {
        const excluded = !(
          this.tv_ex.cats_needed.includes(ex.group) && !ex.hidden
        );
        if (excluded) return false;

        const desc = ex.desc.toLowerCase();
        return !banned.find((word) => desc.includes(word));
      });
    },
    cats_needed: [
      "Middle East / Africa",
      "Europe",
      "North America",
      "Asia / Pacific",
      "Mexico and South America",
    ],
    get: (id: string, country: string, tv_exchgs: exchgs_t) => {
      let key = `${id}.${country}`;
      if (!tv_exchgs[key]) key = `${id}.EU`;
      return tv_exchgs[key];
    },
  };

  private saxo_ex = {
    map: () => {},
    exchgs: (exchgs_raw: b.s.exchg_t[]) => {
      logger.json("SAXO exchanges raw", exchgs_raw);

      return exchgs_raw.reduce(
        (c, exchange) => {
          let {
            CountryCode: country,
            ExchangeId: saxo_id,
            Name: desc,
            IsoMic: mic,
          } = exchange;
          if (desc === "NOT IN USE") return c;

          country = util.string.country(country);
          const key = `${saxo_id}.${country}`;
          c[key] = { saxo_id, desc, country, mic: mic! };
          return c;
        },
        {} as {
          [key: string]: exchg_t;
        },
      );
    },
    verify: (
      tv_exchgs: exchgs_t,
      saxo_exchgs: exchgs_t,
      mic_exchgs: mic_exchgs_t,
    ) => {
      return Object.keys(saxo_to_tv).reduce(
        (c, key) => {
          const saxo = saxo_exchgs[key]!;
          if (!saxo) logger.error(`Missing SAXO key:`, key);

          const mapped = saxo_to_tv[key as keyof typeof saxo_to_tv];
          const { mic: mic_id, id } = mapped as {
            mic?: string;
            id?: string;
          };
          const { country } = saxo;
          const tv = this.tv_ex.get(id!, country, tv_exchgs);
          const mic = mic_id ? mic_exchgs[mic_id] : undefined;

          c[key] = {
            mapped,
            saxo,
            tv,
            mic,
          };

          return c;
        },
        {} as { [key: string]: { mapped: {}; saxo: {}; tv?: {}; mic?: {} } },
      );
    },
  };

  private ibkr_ex = {
    fetch: (): Promise<b.i.exchg_t[]> => {
      return this.fetch(uris.ibkr)
        .then((res) => res.json())
        .then((data) => data.exchanges);
    },
    exchgs: (exchgs_raw: b.i.exchg_t[]) => {
      logger.json("IBKR exchanges raw", exchgs_raw);

      exchgs_raw = this.ibkr_ex.filter_cats(exchgs_raw);

      return exchgs_raw.reduce(
        (c, ex) => {
          let { id: ibkr_id, name: desc, country_code: country } = ex;
          country = util.string.country(country);
          const key = `${ibkr_id}.${country}`;
          c[key] = { ibkr_id, desc, country };
          return c;
        },
        {} as { [key: string]: exchg_t },
      );
    },
    filter_cats: (exchgs: b.i.exchg_t[]) => {
      return exchgs.filter((ex) => {
        const cats = ex.assets.split(",");
        return cats.find((cat) => this.ibkr_ex.cats_needed.includes(cat));
      });
    },
    cats_needed: ["Stocks"],
    verify: (
      tv_exchgs: exchgs_t,
      ibkr_exchgs: exchgs_t,
      mic_exchgs: mic_exchgs_t,
    ) => {
      return Object.keys(ibkr_to_tv).reduce(
        (c, key) => {
          const ibkr = ibkr_exchgs[key]!;
          if (!ibkr) logger.error(`Missing IBKR key:`, key);

          const mapped = ibkr_to_tv[key as keyof typeof ibkr_to_tv];
          const { mic: mic_id, id } = mapped as {
            mic?: string;
            id?: string;
          };
          const { country } = ibkr;
          const tv = this.tv_ex.get(id!, country, tv_exchgs);
          const mic = mic_id ? mic_exchgs[mic_id] : undefined;

          c[key] = {
            mapped,
            ibkr,
            tv,
            mic,
          };

          return c;
        },
        {} as { [key: string]: { mapped: {}; ibkr: {}; tv?: {}; mic?: {} } },
      );
    },
  };

  private mic_ex = {
    fetch: () => this.fetch(uris.iso_mic).then((res) => res.text()),
    exchgs: (csv_string: string) => {
      const lines = util.csv.to_data(csv_string);
      lines.shift();

      return lines.reduce((c, line) => {
        const [
          mic,
          _op_mic,
          _kind,
          desc,
          _legal_name,
          _lei,
          category,
          _acronym,
          country,
          _city,
          _website,
          _status,
          _created,
          _updated,
          _validated,
          _expires,
          _comments,
        ] = line as array_t<string, 17>;

        c[mic] = {
          mic,
          desc,
          country,
          category,
        };
        return c;
      }, {} as mic_exchgs_t);
    },
    cats_needed: ["RMKT", "NSPD"],
  };

  private fetch = (url: string) => fetch(`https://www.${url}`);
}

type tv_echg_t = {
  name: string;
  value: string;
  desc: string;
  flag: string;
  group: string;
  country: string;
  provider_id: string;
  hidden: boolean;
};

type tv_data_t = { exchanges: { exchanges: tv_echg_t[] } };

type mic_exchgs_t = {
  [mic: string]: {
    mic: string;
    desc: string;
    country: string;
    category: string;
  };
};

type exchg_t<
  T =
    | { tv_id: string }
    | { saxo_id: string; mic: string }
    | { ibkr_id: string },
> = T & {
  desc: string;
  country: string;
};

type exchgs_t = { [key: string]: exchg_t };

type array_t<
  T,
  N extends number,
  R extends readonly T[] = [],
> = R["length"] extends N ? R : array_t<T, N, [...R, T]>;
