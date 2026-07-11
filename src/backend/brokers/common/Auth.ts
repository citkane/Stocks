import { Global } from "@backend/Global";

const auth_poll_rate = 500;

export class Auth extends Global {
  constructor(
    private broker: g.broker,
    private keep_alive_rate: number,
  ) {
    super();
    this.add_shutdown_fncs(() => clearInterval(this.poll_auth_interval));
    this.add_shutdown_fncs(() => clearInterval(this.keep_auth_alive_interval));
  }

  protected revoke_auth = (req: Promise<any>) => {
    return req.then(() => {
      this.state = false;
      delete this.resolved;
      this.ws.publish("logged_out", this.broker);
    });
  };
  protected resolver(auth_fnc: () => Promise<boolean>) {
    this.auth_fnc = auth_fnc;

    if (this.resolved) return this.resolved;
    return (this.resolved = this.promise_auth().then(() =>
      this.bootstrap(`${this.broker} is authorised`),
    ));
  }
  public state = false;

  private promise_auth = () => {
    return new Promise<void>((resolve) => {
      if (this.state) return resolve();
      this.poll_for_auth(resolve);
    });
  };

  private poll_for_auth = (resolve?: g.resolve) => {
    clearInterval(this.poll_auth_interval);
    this.poll_auth_interval = setInterval(() => {
      logger.debug("Poll auth", this.broker, this.state);
      this.authoriser().then(check);
    }, auth_poll_rate);

    const check = (auth_state: boolean) => {
      this.state = auth_state;
      if (this.state === true) {
        clearInterval(this.poll_auth_interval);
        if (resolve) resolve();
        this.keep_auth_alive();
      }
    };
  };

  private keep_auth_alive = () => {
    let count = 0;

    clearInterval(this.keep_auth_alive_interval);
    this.keep_auth_alive_interval = setInterval(() => {
      count++;
      this.authoriser()
        .then(check.bind(this))
        .catch(() => check.bind(this)(false));
    }, this.keep_alive_rate);

    function check(this: Auth, state: boolean) {
      this.state = state;
      logger.log(`Keeping auth alive: ${this.broker}`, state, count);
      if (this.state === false) {
        clearInterval(this.keep_auth_alive_interval);
        this.revoke_auth(Promise.resolve());
        this.poll_for_auth();
      }
    }
  };

  private authoriser = () => {
    if (!this.auth_fnc)
      throw `No auth function for ${this.broker}. Did you forget to init Auth?`;
    return this.auth_fnc();
  };
  private auth_fnc?: () => Promise<boolean>;

  private resolved?: Promise<void>;
  private poll_auth_interval?: interval_t;
  private keep_auth_alive_interval?: interval_t;
}
