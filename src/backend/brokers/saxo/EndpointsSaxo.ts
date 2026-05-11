import { Global } from "@backend/Global";

const { redirect, app_key, app_secret } = conf.saxo;
const auth_string = btoa(`${app_key}:${app_secret}`);

const base = "https://gateway.saxobank.com";
const auth = "https://live.logonvalidation.net";
const endpoints = {
  api: "openapi/port/v1",
  chart: "openapi/chart/v3",
  history: "openapi/hist/v1",
  ref: "openapi/ref/v1",
  trade: "openapi/trade/v1",
  client_services: "openapi/cs/v1",
  client_services2: "openapi/cs/v2",
};
const url = {
  api: `${base}/${endpoints.api}`,
  auth,
  chart: `${base}/${endpoints.chart}`,
  history: `${base}/${endpoints.history}`,
  ref: `${base}/${endpoints.ref}`,
  trade: `${base}/${endpoints.trade}`,
  client_services: `${base}/${endpoints.client_services}`,
};

export class EndpointsSaxo extends Global {
  public get = {
    accounts: () => `${url.api}/accounts`,
    balance: (key: string) => {
      const params = [
        `AccountKey=${key}`,
        `ClientKey=${this.saxo.client_key}`,
      ].join("&");
      return `${url.api}/balances?${params}`;
    },
    code_url: () => {
      const _redirect = encodeURI(`${this.http.url}${redirect}`);
      const params = [
        "response_type=code",
        `client_id=${app_key}`,
        `state=${this.context}`,
        `redirect_uri=${_redirect}`,
      ].join("&");

      return `${url.auth}/authorize?${params}`;
    },
    bar_data: (
      asset_type: string,
      conid: string,
      from: string,
      granularity_min: number,
      bar_data_limit: number,
    ) => {
      const params = [
        `Mode=From`,
        `AssetType=${asset_type}`,
        `Time=${from}`,
        `Horizon=${granularity_min}`,
        `Uic=${conid}`,
        `Count=${bar_data_limit}`,
      ];
      return `${url.chart}/charts?${params.join("&")}`;
    },
    open_positions: (skip: number) => {
      const grps = "PositionView,PositionBase,DisplayAndFormat";
      const params = [`$skip=${skip}`, `fieldGroups=${grps}`].join("&");
      return `${url.api}/positions/me?${params}`;
    },
    closed_positions: (skip: number) => {
      const to = util.time.epoch.to_iso_date();
      const from = conf.saxo.start_date;
      const key = this.saxo.client_key;
      return `${url.client_services}/reports/closedPositions/${key}/${from}/${to}?$skip=${skip}`;
    },
    trades: (skip: number) => {
      const to = util.time.epoch.to_iso_date();
      const from = conf.saxo.start_date;
      const key = this.saxo.client_key;
      return `${url.client_services}/reports/trades/${key}/?$skip=${skip}&FromDate=${from}&ToDate=${to}`;
    },
    transactions: (skip: number, start_date: string) => {
      const transaction_types = "All";
      const params = [
        `FromDate=${start_date}`,
        `ToDate=${util.time.epoch.to_iso_date()}`,
        `TransactionType=${transaction_types}`,
        `ClientKey=${this.saxo.client_key}`,
        `$skip=${skip}`,
      ].join("&");
      return `${url.history}/transactions?${params}`;
    },
    client: () => {
      return `${url.api}/clients/me`;
    },
    logout: () => {
      return `${url.auth}/logout`; //oidclogout
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
      const params = {
        method: "POST",
        body: [
          `grant_type=${grant_type}`,
          `${code_key}=${code}`,
          `redirect_uri=${redirect_uri}`,
        ].join("&"),
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${auth_string}`,
        },
      };
      return { url: `${url.auth}/token`, params };
    },
  };

  private get context() {
    return this._context
      ? this._context
      : (this._context = util.random_context());
  }
  private _context?: string;
}
