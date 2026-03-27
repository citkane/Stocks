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
        if (this.auth.authorised) {
          clearInterval(interval);
          resolve(true);
        }
      }, this.fetch_rate);

      this.add_shutdown_fnc(() => clearInterval(interval));
    });
  }

  public authorised = false;

  private poll_for_auth = () => {
    const interval = setInterval(() => {
      this.auth.is_authorised().then(check);
    }, this.fetch_rate);

    const check = (success: boolean) => {
      if (this.authorised) return clearInterval(interval);
      if ((this.authorised = success)) {
        clearInterval(interval);
        this.keep_auth_alive();
      }
    };

    this.add_shutdown_fnc(() => clearInterval(interval));
  };

  private keep_auth_alive = () => {
    let count = 0;
    const interval = setInterval(() => {
      console.info(`Keeping auth alive: ${this._broker}`, count);
      count++;
      this.auth
        .is_authorised()
        .then(check)
        .catch(() => check(false));
    }, this.keep_alive_interval);

    const check = (success: boolean) => {
      if (!this.authorised) return clearInterval(interval);
      if (!(this.authorised = success)) {
        clearInterval(interval);
        this.poll_for_auth();
      }
    };

    this.add_shutdown_fnc(() => clearInterval(interval));
  };

  private get auth() {
    return this.broker[this._broker].auth;
  }
}
