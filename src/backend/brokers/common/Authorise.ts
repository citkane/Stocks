import type { saxo, ibkr } from "../";
import { Global } from "backend";

export default class Authorise extends Global {
  wait_for_auth(): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.auth.authorised) return resolve(true);
      const interval = setInterval(() => {
        if (!this.auth.authorised) return;
        clearInterval(interval);
        resolve(true);
      }, 100);
    });
  }

  poll_for_auth(): Promise<boolean> {
    if (this.auth.authorised) return Promise.resolve(true);

    return this.auth
      .is_authorised()
      .then((success) => {
        this.auth.authorised = success;
        if (!success) throw Error();
        this.keep_auth_alive();
        return true;
      })
      .catch(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve(this.poll_for_auth()), 100),
          ),
      );
  }

  private keep_auth_alive() {
    const interval = this.auth.keepalive_interval;
    this.auth
      .is_authorised()
      .then((success) => {
        this.auth.authorised = success;
        if (!success) throw Error();
        setTimeout(() => this.keep_auth_alive(), interval);
      })
      .catch(() => this.poll_for_auth());
  }

  init(b: broker_t) {
    this.auth = this.broker[b].authorise;
    this.poll_for_auth();
  }
  private auth!:
    | InstanceType<typeof saxo.Authorise>
    | InstanceType<typeof ibkr.Authorise>;
}
