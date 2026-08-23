import { Global } from "@backend/Global";
import FetchManager from "fetch-manager";
import LibCallback from "fetch-manager/lib";

const lib_callback = new LibCallback<"req">();
const { redirect, app_key, app_secret } = conf.saxo,
  auth_string = btoa(`${app_key}:${app_secret}`),
  req_max_per_s = 250,
  req_max_concurrent = 20,
  base = "https://gateway.saxobank.com",
  auth = "https://live.logonvalidation.net",
  api = {
    base: `${base}/openapi/port/v1`,
    chart: `${base}/openapi/chart/v3`,
    history: `${base}/openapi/hist/v1`,
    ref: `${base}/openapi/ref/v1`,
    trade: `${base}/openapi/trade/v1`,
    client_services: `${base}/openapi/cs/v1`,
    auth_url: `${auth}/authorize`,
    auth_token: `${auth}/token`,
    auth_logout: `${auth}/logout`,
  };

export class SaxoApi extends Global {
  constructor() {
    super();
    const pms = this.fetcher.constructor();
    this.fetch = new FetchManager<"req">(...pms).fetch;
  }
  public get = {
    accounts: () => {
      const req_init = this.fetcher.default_headers();
      return new Request(`${api.base}/accounts`, req_init);
    },
    balance: (key: string) => {
      const params = new URLSearchParams({
        AccountKey: key,
        ClientKey: this.saxo.client_key,
      }).toString();
      const req_init = this.fetcher.default_headers();
      return new Request(`${api.base}/balances?${params}`, req_init);
    },
    auth_url: () => {
      const _redirect = encodeURI(`${this.http.url}${redirect}`);
      const params = new URLSearchParams({
        response_type: "code",
        client_id: app_key,
        state: this.api_context,
        redirect_uri: _redirect,
      }).toString();
      return new Request(`${api.auth_url}?${params}`);
    },
    bar_data: (
      asset_type: string,
      conid: string,
      from: string,
      granularity_min: number,
      bar_data_limit: number,
    ) => {
      const params = new URLSearchParams({
        Mode: "From",
        AssetType: asset_type,
        Time: from,
        Horizon: String(granularity_min),
        Uic: conid,
        Count: String(bar_data_limit),
      }).toString();
      const req_init = this.fetcher.default_headers();
      return new Request(`${api.chart}/charts?${params}`, req_init);
    },
    open_positns: (skip: number) => {
      const grps = "PositionView,PositionBase,DisplayAndFormat";
      const params = new URLSearchParams({
        $skip: String(skip),
        fieldGroups: grps,
      }).toString();
      const req_init = this.fetcher.default_headers();
      return new Request(`${api.base}/positions/me?${params}`, req_init);
    },
    closed_positns: (skip: number) => {
      const to = util.time.epoch.to_iso_date();
      const from = conf.saxo.start_date;
      const key = this.saxo.client_key;
      const params = new URLSearchParams({
        $skip: String(skip),
      }).toString();
      const req_init = this.fetcher.default_headers();
      const _url = `${api.client_services}/reports/closedPositions/${key}/${from}/${to}?${params}`;
      return new Request(_url, req_init);
    },
    positn_details: (skip: number, ids: number[]) => {
      const params = new URLSearchParams({
        $skip: String(skip),
        AssetTypes: "Etf,Stock",
        Uics: ids.join(),
      }).toString();
      const url = `${api.ref}/instruments?${params}`;
      const req_init = this.fetcher.default_headers();
      return new Request(url, req_init);
    },
    trades: (skip: number) => {
      const key = this.saxo.client_key;
      const params = new URLSearchParams({
        $skip: String(skip),
        FromDate: conf.saxo.start_date,
        ToDate: util.time.epoch.to_iso_date(),
      }).toString();
      const req_init = this.fetcher.default_headers();
      const url = `${api.client_services}/reports/trades/${key}/?${params}`;
      return new Request(url, req_init);
    },
    transactions: (skip: number, start_date: string) => {
      const transaction_types = "All";
      const params = new URLSearchParams({
        FromDate: start_date,
        ToDate: util.time.epoch.to_iso_date(),
        TransactionType: transaction_types,
        ClientKey: this.saxo.client_key,
        $skip: String(skip),
      }).toString();
      const req_init = this.fetcher.default_headers();
      return new Request(`${api.history}/transactions?${params}`, req_init);
    },
    client: () => {
      const req_init = this.fetcher.default_headers();
      return new Request(`${api.base}/clients/me`, req_init);
    },
    logout: () => {
      const req_init = this.fetcher.default_headers();
      return new Request(`${api.auth_logout}`, req_init);
    },
  };
  public post = {
    token: (
      code: string,
      grant_type: "authorization_code" | "refresh_token",
    ) => {
      const redirect_uri = `${this.http.url}${redirect}`;
      const code_key =
        grant_type === "authorization_code" ? "code" : "refresh_token";
      const body = new URLSearchParams({
        grant_type,
        [code_key]: code,
        redirect_uri,
      });
      const headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${auth_string}`,
      };
      const req_init = {
        method: "POST",
        body,
        headers,
      };
      return new Request(`${api.auth_token}`, req_init);
    },
  };
  public pager_cb = async (res: Response, req: fm.req<"req">) => {
    const data = await res.json();
    if (!data.__next) return;
    const skip = data.Data.length;
    const url = new URL(req.url);
    url.searchParams.set("$skip", String(skip));
    return new Request(url.toString(), req);
  };

  private fetcher = {
    default_headers: (): RequestInit => ({
      headers: {
        Authorization: `Bearer ${this.saxo.auth_bearer}`,
      },
    }),
    targets: <T extends fm.kind>(): fm.opts.target<T>[] => {
      const urls = Object.values(api).map((url) => new URL(url).hostname);
      return [...new Set(urls)];
    },
    response_cb: lib_callback.response.generic,
    trace_cb: lib_callback.trace.generic,
    constructor: () => {
      const { response_cb } = this.fetcher;
      return [
        req_max_per_s,
        req_max_concurrent,
        "sec",
        this.fetcher.targets(),
        {
          response_cb,
        },
      ] as const;
    },
  };

  public fetch: InstanceType<typeof FetchManager>["fetch"];
  private get api_context() {
    return SaxoApi.api_context;
  }
  private static api_context = (() => util.random_context())();
}
