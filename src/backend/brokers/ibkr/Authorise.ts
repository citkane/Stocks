import type { Ibkr } from "..";
import type { ibkr_t } from "../../../types";

const keep_alive_time = 60000;

export class Authorise {
  constructor(private ibkr: Ibkr) {}
  public is_authenticated = () =>
    this.ibkr
      .fetch(this.endpoints.tickle)
      .then((res) => res.json())
      .then((tickle: ibkr_t.tickle_t) => tickle.iserver.authStatus)
      .then((status) => status.authenticated)
      .catch((_err) => false);

  public poll_authenticated = (): Promise<boolean> =>
    this.is_authenticated().then((success) => {
      if (!success) return this.poll_authenticated();
      if (!this.staying_alive) this.keep_alive();
      return Promise.resolve(true);
    });

  private keep_alive = () => {
    this.staying_alive = true;
    this.is_authenticated().then((success) => {
      if (!success) return (this.staying_alive = false);
      setTimeout(() => {
        this.keep_alive();
      }, keep_alive_time);
    });
  };

  private endpoints = {
    status: "iserver/auth/status",
    tickle: "tickle",
  };
  private staying_alive = false;
}

//function get_authenticated(this: Ibkr) {
//	return this.fetch(endpoints.status)
//		.then(res => res.json())
//		.then((status: ibkr_t.status_t) => status.authenticated)
//		.catch(_err => false)
//}
