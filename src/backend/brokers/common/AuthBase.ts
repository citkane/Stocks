import { Global } from "backend";

export class AuthBase extends Global {
  constructor(private _broker: broker_t) {
    super();
    setTimeout(() => this.poll_for_auth());
  }

  await_auth(): Promise<boolean> {
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

  private get auth() {
    return this.broker[this._broker].auth;
  }
}
