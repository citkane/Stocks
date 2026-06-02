type window_t = ReturnType<typeof window.open>;
type p_id_t = `${broker_t}_${string}`;
type i_id_t = `${string}-${string}`;
type resolve_t = Promise.resolve;
type reject_t = Promise.reject;
type resolver_t = {
  resolve: resolve_t;
  reject: resolve_t;
};
type ws_t = Bun.ServerWebSocket | WebSocket;
type res_error_t = {
  status: number;
  statusText: string;
  url?: string;
};
type transctn_t = {
  id: string;
  p_id: p_id_t;
  a_id: string;
  i_id: i_id_t;
  broker: broker_t;
  currency: currency_t;
  amount: number;
  date: number;
  kind: "buy" | "sell" | "dividend" | "unbooked";
  price_traded: number;
  fx_traded: number;
  price_market?: number;
  fx_market?: number;
  dividend?: number;
  r_pl?: number;
  meta?: {
    dividend?: number | string;
    traded_value?: number | string;
    amount?: number | string;
    u_pl?: number | string;
    fx_pl?: number | string;
    market_value?: number | string;
    sales?: number | string;
  };
};
type live_data_t = {
  i_id: i_id_t;
  price_market: number;
  //fx_market: number;
  div_yield?: number;
};
type account_t = {
  a_id: string;
  a_id_original: string;
  broker: broker_t;
  alias?: string;
  currency: currency_t;
  saxo_key?: string;
};
type balance_t = Omit<account_t, "saxo_key"> & {
  assets_val: number;
  cash: number;
};

type fx_pair_t = {
  currency_t: number;
};

interface Api_t {
  requests: {
    [key: string]: (p: req_t, ...params: any[]) => void;
  };
  setter: {
    [key: string]: (...params: any[]) => void;
  };
}

type data_t = object | string | number | boolean;
type chart_data_t = {
  open: number;
  close: number;
  high: number;
  low: number;
  volume: number;
  time: UTCTimestamp;
};

type interval_t = ReturnType<typeof setInterval>;

type instrmnt_t = {
  i_id: i_id_t;
  ticker: string;
  exchange: string;
  currency: currency_t;
  description: string;
  about_instrmnt?: string;
  asset_class?: string;
  asset_industry?: string;
  asset_sector?: string;
  isin?: string;
  cfi?: string;
  website?: string;
  svg_logo?: string;
  div_yield?: number;
  saxo_id?: number;
  ibkr_id?: number;
} & geo_data_t;

type cache_t = {
  accounts: account_t[];
  instruments: { [i_id: i_id_t]: instrmnt_t };
  transactions: { [i_id: i_id_t]: transctn_t[] };
  live_data: {
    data?: live_data_t[];
    balances?: { [a_id: string]: balances_t[] };
    fx?: fx_rates_t;
  };
};

type iso_date_t = `${string}-${string}-${string}`;

type geo_data_t = {
  place: string;
  region: string;
  country: string;
  place_qid: string;
  country_qid: string;
  region_qid: string;
  place_link: string;
  region_link: string;
  country_link: string;
  place_point?: string;
  region_point?: string;
  country_shape?: string;
  region_shape?: string;
};

namespace f {
  type positn_t = { [key in `${transctn_t["kind"]}s`]: transctn_t[] };
}
namespace b {
  type positn_t = {
    saxo_id?: number;
    ibkr_id?: number;
    i_id: i_id_t;
    currency: currency_t;
    description: string;
  };
  type exchange_t = { tv: string | null; mic: string | null };
  type exchg_map_t = {
    [key in broker_t]: {
      [key: string]: exchange_t;
    };
  };
}

/**
 * Function parameter types
 */
namespace p {
  type chart_period = [conid: string, period: period_t, granularity: period_t];
  type req_broker = [p: req_t, broker: broker_t];
  type prop_callback = { name: string; old: string; new: string };
}
