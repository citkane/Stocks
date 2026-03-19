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

type broker_t = "saxo" | "ibkr";
type position_t = {
  p_id: string;
  con_id: string;
  broker: broker_t;
  a_id: string;
  description: string;
  ticker: string;
  currency: currency_t;
  exchange: string;
  position: number;
  fx_market: number;
  fx_buy: number;
  date: string | number;
  price_market: number;
  price_buy: number;
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
  alias: string;
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
  [key: string]: number;
};

interface Api_t {
  request: {
    [key: string]: (p: req_t, ...params: any[]) => void;
  };
  set: {
    [key: string]: (...params: any[]) => void;
  };
}

type data_t = object | string | number | boolean;
type stock_data_t = {
  bar: {
    open: number;
    close: number;
    high: number;
    low: number;
    time: UTCTimestamp;
  }[];
  volume: {
    color: string;
    value: number;
    time: UTCTimestamp;
  }[];
  price: {
    value: number;
    time: UTCTimestamp;
  }[];
};

type interval_t = ReturnType<typeof setInterval>;

/**
 * Function parameter types
 */
namespace p {
  type chart_data = [conid: string, period: period_t, granularity: period_t];
  type req_broker = [p: req_t, broker: broker_t];
}
