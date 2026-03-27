type window_t = ReturnType<typeof window.open>;

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
};

//type position_t = {
//  p_id: string;
//  con_id: string;
//  broker: broker_t;
//  a_id: string;
//  description: string;
//  ticker: string;
//  currency: currency_t;
//  exchange: string;
//  position: number;
//  fx_traded: number;
//  price_traded: number;
//  date: string | number;
//  kind: "buy" | "sell" | "dividend";
//};

type position_t = {
  p_id: string;
  con_id: string;
  broker: broker_t;
  a_id: string;
  description: string;
  ticker: string;
  currency: currency_t;
  exchange: string;
  amount: number;
  fx_market: number;
  fx_traded: number;
  date: number;
  price_market: number;
  price_traded: number;
  kind: "buy" | "sell" | "dividend";
};
type transaction_t = {
  position: number;
  account_id: string;
  description: string;
  fx_buy: number;
  date: number | string;
  price_buy: number;
  open: boolean;
  external_transfer: boolean;
};
type account_t = {
  a_id: string;
  a_id_original: string;
  broker: broker_t;
  alias?: string;
  currency: currency_t;
};
type stock_t = {
  con_id: string;
  broker: broker_t;
  ticker: string;
  description: string;
  positions: Set<position_t>;
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

/**
 * Function parameter types
 */
namespace p {
  type chart_data = [conid: string, period: period_t, granularity: period_t];
  type req_broker = [p: req_t, broker: broker_t];
  type prop_callback = { name: string; old: string; new: string };
}
