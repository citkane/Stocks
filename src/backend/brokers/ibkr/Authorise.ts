import { AuthBase } from "@backend/brokers/common/AuthBase";

const ping_auth_interval = 60000;

export class Authorise extends AuthBase {
  constructor() {
    super("ibkr", ping_auth_interval);
  }

  public is_authorised = () =>
    this.renew_auth()
      .then((status) => (this.authorised = status.authenticated))
      .catch((_err) => false);

  private renew_auth = () =>
    this.ibkr
      .fetch<ibkr_t.tickle_t>(this.endpoints.tickle())
      .then((tickle) => tickle.iserver.authStatus);

  private endpoints = {
    status: () => `${this.api_url}/iserver/auth/status`,
    tickle: () => `${this.api_url}/tickle`,
  };

  public authorised = false;

  private get api_url() {
    return util.url.ibkr.api;
  }
}
