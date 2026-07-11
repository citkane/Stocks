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
  url?: string;
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
type interval_t = ReturnType<typeof setInterval>;

namespace id {
  /** account id */
  type a = `${g.broker}_${string}`;
  /** instrument id (broker "exchange-ticker")*/
  type i = `${string}-${string}`;
  /** position id (tv "exchange-ticker") */
  type p = i;
  //** broker position identifier */
  type broker = number;
}

/** Generic global types */
namespace g {
  type resolve = Promise.resolve;
  type reject = Promise.reject;
  type resolver = {
    resolve: resolve_t;
    reject: resolve_t;
  };
  type broker = "ibkr" | "saxo";
  type instrmnt = db.data<"instrmnt">;
  type meta = db.data<"instrmnt_meta">;
  type meta_view = db.data<"view_instrmnt_meta">;
  type transctn = db.data<"transactions">;
  type transctn_v = db.data<"view_transctns">;
  type account = db.data<"accounts">;

  type meta_geo = {
    place?: string;
    region?: string;
    country?: string;
    place_qid?: string;
    country_qid?: string;
    region_qid?: string;
    place_link?: string;
    region_link?: string;
    country_link?: string;
    place_point?: geo_point;
    region_point?: geo_point;
    country_shape?: Object;
    region_shape?: Object;
  };
  type qid_map = db.data<"view_qid_map">["geo_map"];
  type geo_point = [number, number];
  type iso_date = `${string}-${string}-${string}`;
}

/** Live data */
namespace lv {
  type transctn_kind = "buy" | "sell" | "dividend" | "unbooked";
  type transctn = pos.transctn;
  type positn = pos.live;
  type chart_data = db.data<"live_chart">;
  type forex = db.data<"live_forex">;
  type fx_map = { [currency: string]: forex };
  type balance = db.data<"live_balances">;
  type instrmnt = db.data<"live_instrmnt">;
}

/**
 * Function parameter types
 */
namespace pr {
  type chart_period = [conid: string, period: period_t, granularity: period_t];
  type prop_callback = { name: string; old: string; new: string };
}
