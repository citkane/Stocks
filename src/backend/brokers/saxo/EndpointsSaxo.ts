import { Broker } from "@backend/brokers/common";
import Fetch, {
  type frm_constructor_t,
  type frm_host_t,
} from "@common/FetchRateManager";
import "@common/FetchRateManager";

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

export class EndpointsSaxo extends Broker {
  protected get = {
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
        state: this.context,
        redirect_uri: _redirect,
      }).toString();
      //const req_init = this.fetcher.default_headers();
      return new Request(`${api.auth_url}?${params}`); //, req_init);
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
    open_positions: (skip: number) => {
      const grps = "PositionView,PositionBase,DisplayAndFormat";
      const params = new URLSearchParams({
        $skip: String(skip),
        fieldGroups: grps,
      }).toString();
      const req_init = this.fetcher.default_headers();
      return new Request(`${api.base}/positions/me?${params}`, req_init);
    },
    closed_positions: (skip: number) => {
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
    trades: (skip: number) => {
      const key = this.saxo.client_key;
      const params = new URLSearchParams({
        $skip: String(skip),
        FromDate: conf.saxo.start_date,
        ToDate: util.time.epoch.to_iso_date(),
      }).toString();
      const req_init = this.fetcher.default_headers();
      const _url = `${api.client_services}/reports/trades/${key}/?${params}`;
      return new Request(_url, req_init);
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
  protected post = {
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
      }).toString();
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
  private fetcher = {
    //should_retry: (_res: Response) => false,
    //set_retry_timeout_ms: (_res: Response) => 500,
    hosts: (): frm_host_t[] => {
      const urls = Object.values(api).map((url) => new URL(url).hostname);
      const hostnames = [...new Set(urls)];
      //const { should_retry, set_retry_timeout_ms } = this.fetcher;
      return hostnames.map((hostname) => ({
        hostname,
        //should_retry,
        //set_retry_timeout_ms,
      }));
    },
    data_handler: async (_req: Request, res: Response) => {
      //const { origin, pathname } = new URL(req.url);
      //if (`${origin}${pathname}` === api.auth_url) return res;

      const type = res.headers.get("content-type");
      const data = type?.includes("json") ? await res.json() : await res.text();
      return data;
    },
    default_headers: (): RequestInit => ({
      headers: {
        Authorization: `Bearer ${this.saxo.auth_bearer}`,
      },
    }),
    constructor: (): frm_constructor_t =>
      [
        req_max_per_s,
        req_max_concurrent,
        "sec",
        this.fetcher.hosts(),
        this.fetcher.data_handler,
      ] as const,
  };

  private get context() {
    return this._context
      ? this._context
      : (this._context = util.random_context());
  }

  protected fetch = new Fetch(...this.fetcher.constructor()).fetch;
  private _context?: string;
}
