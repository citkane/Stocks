type broker_t = "ibkr" | "saxo";
type window_t = ReturnType<typeof window.open>;
type p_id_t = `${broker_t}_${string}`;
type i_id_t = `${string}-${string}`;
type a_id_t = `${broker_t}_${string}`;
type resolve_t = Promise.resolve;
type reject_t = Promise.reject;
type conf_t = {
  base_currency: string;
  brokers: broker_t[];
  http_port: number;
  ws_port: number;
  saxo: {
    start_date: `${string}-${string}-${string}`;
    app_key: string;
    app_secret: string;
    redirect: string;
  };
  ibkr: {
    start_date: `${string}-${string}-${string}`;
    base: string;
  };
};
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
  currency: string;
  amount?: number;
  date: number;
  kind: "buy" | "sell" | "dividend" | "unbooked";
  price_traded?: number;
  fx_traded?: number;
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

type account_t = {
  a_id: a_id_t;
  //a_id_original: string;
  broker: broker_t;
  currency: string;
  alias?: string;
  broker_key?: string;
};
type balance_t = db.data<"balances">;

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
  currency: string;
  description: string;
  about_instrmnt?: string;
  asset_class?: string;
  asset_industry?: string;
  asset_sector?: string;
  isin?: string;
  //cfi?: string;
  website?: string;
  svg_logo?: string;
  //div_yield?: number;
  saxo_id?: number;
  ibkr_id?: number;
} & geo_data_t;

type cache_t = {
  accounts: account_t[];
  instruments: { [i_id: i_id_t]: instrmnt_t };
  transactions: { [i_id: i_id_t]: transctn_t[] };
  instrument_data: { [i_id: i_id_t]: db.data<"instrument_data"> };
  forex: { [currency: string]: db.data<"forex"> };
  balances: { [a_id: string]: db.data<"balances"> };
  live_data: live_data_t;
};
type live_data_t = {
  instrmnts: { [i_id: string]: db.data<"instrument_data"> & { fx: number } };
  balances: { [a_id: string]: db.data<"balances"> & { fx: number } };
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
//namespace b {
//  type positn_t = {
//    saxo_id?: number;
//    ibkr_id?: number;
//    i_id: i_id_t;
//    currency: string;
//    description: string;
//  };
//  type exchange_t = { tv: string | null; mic: string | null };
//  type exchg_map_t = {
//    [key in broker_t]: {
//      [key: string]: exchange_t;
//    };
//  };
//}

/**
 * Function parameter types
 */
namespace p {
  type chart_period = [conid: string, period: period_t, granularity: period_t];
  type req_broker = [p: req_t, broker: broker_t];
  type prop_callback = { name: string; old: string; new: string };
}
