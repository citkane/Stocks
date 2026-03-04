import type { Ibkr } from "backend";
import type { ibkr_t } from "types";

const keep_alive_time = 60000;

export class Authorise {
  constructor(private ibkr: Ibkr) {}
  public is_authorised = () =>
    this.ibkr
      .fetch(this.endpoints.tickle)
      .then((res) => res.json())
      .then((tickle: ibkr_t.tickle_t) => tickle.iserver.authStatus)
      .then((status) => status.authenticated)
      .catch((_err) => false);

  public wait_for_authorised = () => {
    return new Promise((resolve) => {
      if (Authorise.is_authorised) return resolve(true);
      const interval = setInterval(() => {
        if (Authorise.is_authorised) {
          clearInterval(interval);
          resolve(true);
        }
      }, 10);
    });
  };

  public keep_alive = () => {
    Authorise.is_authorised = true;
    this.is_authorised().then((success) => {
      if (!success) return (Authorise.is_authorised = false);
      setTimeout(() => {
        this.keep_alive();
      }, keep_alive_time);
    });
  };

  private endpoints = {
    status: "iserver/auth/status",
    tickle: "tickle",
  };

  private static is_authorised = false;
}

//function get_authenticated(this: Ibkr) {
//	return this.fetch(endpoints.status)
//		.then(res => res.json())
//		.then((status: ibkr_t.status_t) => status.authenticated)
//		.catch(_err => false)
//}
