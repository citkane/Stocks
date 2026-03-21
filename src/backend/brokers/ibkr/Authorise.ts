import { AuthBase } from "@backend/brokers/common/AuthBase";

const ping_auth_interval = 60000;

export class Authorise extends AuthBase {
  constructor(fetch_rate: number) {
    super("ibkr", ping_auth_interval, fetch_rate);
  }

  public is_authorised = () =>
    this.renew_auth()
      .then((status) => status.authenticated)
      .catch((_err) => false);

  private renew_auth = () =>
    this.ibkr
      .fetch<ibkr_t.tickle_t>(this.endpoints.tickle())
      .then((tickle) => tickle.iserver.authStatus);

  private endpoints = {
    status: () => `${this.api_url}/iserver/auth/status`,
    tickle: () => `${this.api_url}/tickle`,
  };

  private get api_url() {
    return util.url.ibkr.api;
  }
}
