import AuthBase from "@backend/brokers/common/Authorise";

const keepalive_interval = 60000;

export default class Authorise extends AuthBase {
  constructor() {
    super("ibkr");
  }
  public is_authorised = () =>
    this.renew_auth()
      .then((status) => (this.authorised = status.authenticated))
      .catch((_err) => false);

  private renew_auth = () =>
    this.ibkr
      .fetch<ibkr_t.tickle_t>(this.endpoints.tickle)
      .then((tickle) => tickle.iserver.authStatus);

  private endpoints = {
    status: "iserver/auth/status",
    tickle: "tickle",
  };

  public authorised = false;
  public keepalive_interval = keepalive_interval;
}
