import { Ibkr } from "backend";
import type { ibkr_t } from "types";
import { poll_for_auth, wait_for_auth } from "backend";

const keepalive_interval = 60000;

export class Authorise {
  constructor(private ibkr: Ibkr) {
    this.poll_for_auth();
  }
  public wait_for_auth = () => wait_for_auth.bind(this, Authorise)();
  public is_authorised = () =>
    this.renew_auth()
      .then((status) => (Authorise.is_authorised = status.authenticated))
      .catch((_err) => false);

  private renew_auth = () =>
    this.ibkr
      .fetch<ibkr_t.tickle_t>(this.endpoints.tickle)
      .then((tickle) => tickle.iserver.authStatus);

  private poll_for_auth = () => poll_for_auth.bind(this, Authorise)();

  private endpoints = {
    status: "iserver/auth/status",
    tickle: "tickle",
  };

  public static is_authorised = false;
  public static keepalive_interval = keepalive_interval;
}
