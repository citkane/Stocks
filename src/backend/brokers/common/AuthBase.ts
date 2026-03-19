import { Global } from "backend";

export class AuthBase extends Global {
  constructor(
    private _broker: broker_t,
    private keep_alive_interval: number,
  ) {
    super();
    setTimeout(() => this.poll_for_auth());
  }

  public await_auth() {
    return new Promise((resolve) => {
      if (this.auth.authorised) return resolve(true);

      const interval = setInterval(() => {
        if (this.auth.authorised)
          this.reset_interval(interval, () => resolve(true));
      }, 100);
    });
  }

  private poll_for_auth = () => {
    return new Promise((resolve) => {
      if (this.authorised) return resolve(true);

      const interval = setInterval(() => {
        this.is_authorised().then(check);
      }, 250);

      const check = (success: boolean) =>
        (this.authorised = success)
          ? this.reset_interval(interval, callback)
          : null;
      const callback = () => {
        this.keep_auth_alive();
        resolve(true);
      };
    });
  };

  private keep_auth_alive = () => {
    const interval = setInterval(() => {
      this.is_authorised()
        .then(check)
        .catch(() => check(false));
    }, this.keep_alive_interval);
    const check = (success: boolean) =>
      (this.authorised = success)
        ? null
        : this.reset_interval(interval, this.poll_for_auth);
  };

  private reset_interval = (interval: interval_t, fnc: Function) => {
    clearInterval(interval);
    fnc();
  };

  private get auth() {
    return this.broker[this._broker].auth;
  }
  private get is_authorised() {
    return this.auth.is_authorised;
  }
  private get authorised() {
    return this.auth.authorised;
  }
  private set authorised(success: boolean) {
    this.auth.authorised = success;
  }
}
