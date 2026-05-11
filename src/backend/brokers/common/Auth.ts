import { Global } from "backend";
const auth_poll_rate = 500;

export class Auth extends Global {
  constructor(
    private _broker: broker_t,
    private keep_alive_rate: number,
  ) {
    super();

    this.add_shutdown_fncs(() => clearInterval(this.poll_auth_interval));
    this.add_shutdown_fncs(() => clearInterval(this.keep_auth_alive_interval));

    setTimeout(() => this.poll_for_auth());
  }

  public await_auth() {
    return new Promise((resolve) => {
      if (this.auth_state) return resolve(true);

      const interval = setInterval(() => {
        logger.debug("Await auth", this._broker);
        if (this.broker_auth.auth_state) {
          clearInterval(interval);
          resolve(true);
        }
      }, auth_poll_rate);

      this.add_shutdown_fncs(() => clearInterval(interval));
    });
  }

  private poll_for_auth = () => {
    clearInterval(this.poll_auth_interval);
    this.poll_auth_interval = setInterval(() => {
      logger.debug("Poll auth", this._broker, this.auth_state);
      this.broker_auth.is_authorised().then(check);
    }, auth_poll_rate);

    const check = (auth_state: boolean) => {
      this.auth_state = auth_state;
      if (this.auth_state === true) {
        clearInterval(this.poll_auth_interval);
        this.keep_auth_alive();
      }
    };
  };

  private keep_auth_alive = () => {
    let count = 0;
    clearInterval(this.keep_auth_alive_interval);
    this.keep_auth_alive_interval = setInterval(() => {
      logger.log(`Keeping auth alive: ${this._broker}`, count);
      count++;
      this.broker_auth
        .is_authorised()
        .then(check)
        .catch(() => check(false));
    }, this.keep_alive_rate);

    const check = (state: boolean) => {
      this.auth_state = state;
      if (this.auth_state === false) {
        clearInterval(this.keep_auth_alive_interval);
        this[this._broker].revoke_auth();
        this.poll_for_auth();
      }
    };
  };

  public auth_state = false;
  private poll_auth_interval?: interval_t;
  private keep_auth_alive_interval?: interval_t;

  private get broker_auth() {
    return this.broker[this._broker].broker_auth;
  }
}
