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

type position_t = { [key in `${transaction_t["kind"]}s`]: transaction_t[] };

type transaction_t = {
  id: string;
  p_id: string;
  con_id: string;
  a_id: string;
  broker: broker_t;
  description: string;
  ticker: string;
  currency: currency_t;
  exchange?: string;
  amount: number;
  fx_market?: number;
  fx_traded?: number;
  date: number;
  price_market?: number;
  price_traded?: number;
  kind: "buy" | "sell" | "dividend";
  state?: "open" | "closed";
};

type account_t = {
  a_id: string;
  a_id_original: string;
  broker: broker_t;
  alias?: string;
  currency: currency_t;
};
type stock_t<T = Set<transaction_t> | transaction_t[]> = {
  con_id: string;
  broker: broker_t;
  ticker: string;
  description: string;
  transactions: { [key in keyof position_t]: T };
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

namespace b {
  type market_view_t = {
    price_market: number;
    ticker?: string;
    exchange?: exchanges_t;
    description?: string;
    industry?: string;
    category?: string;
  };
  type market_view_map_t = Map<string | number, b.market_view_t>;
}

/**
 * Function parameter types
 */
namespace p {
  type chart_data = [conid: string, period: period_t, granularity: period_t];
  type req_broker = [p: req_t, broker: broker_t];
  type prop_callback = { name: string; old: string; new: string };
}
