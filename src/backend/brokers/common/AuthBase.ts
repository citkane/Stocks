import { Global } from "backend";

export class AuthBase extends Global {
  constructor(
    private _broker: broker_t,
    private keep_alive_interval: number,
    private fetch_rate: number,
  ) {
    super();
    setTimeout(() => this.poll_for_auth());
  }

  public await_auth() {
    return new Promise((resolve) => {
      if (this.auth.authorised) return resolve(true);

      const interval = setInterval(() => {
        if (this.auth.authorised) this.clear(interval, () => resolve(true));
      }, this.fetch_rate);

      this.add_shutdown_fnc(() => clearInterval(interval));
    });
  }

  public authorised = false;

  private poll_for_auth = () =>
    new Promise<void>((resolve) => {
      if (this.authorised) return resolve();

      const interval = setInterval(() => {
        this.auth.is_authorised().then(check);
      }, this.fetch_rate);

      const check = (success: boolean) =>
        (this.authorised = success) && this.clear(interval, authorised);

      const authorised = () => {
        this.keep_auth_alive();
        resolve();
      };

      this.add_shutdown_fnc(() => clearInterval(interval));
    });

  private keep_auth_alive = () => {
    const interval = setInterval(() => {
      this.auth
        .is_authorised()
        .then(check)
        .catch(() => check(false));
    }, this.keep_alive_interval);

    const check = (success: boolean) =>
      (this.authorised = success) && this.clear(interval, this.poll_for_auth);

    this.add_shutdown_fnc(() => clearInterval(interval));
  };

  private clear = (interval: interval_t, fnc: Function) => {
    clearInterval(interval);
    fnc();
  };

  private get auth() {
    return this.broker[this._broker].auth;
  }
}
