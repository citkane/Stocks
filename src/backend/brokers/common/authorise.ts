import type { Authorise as Authorise_saxo_t } from "backend/saxo";
import type { Authorise as Authorise_ibkr_t } from "backend/ibkr";

type authorise_t =
  | InstanceType<typeof Authorise_ibkr_t>
  | InstanceType<typeof Authorise_saxo_t>;
type Authorise_t = typeof Authorise_ibkr_t | typeof Authorise_saxo_t;

export function wait_for_auth(Class: Authorise_t): Promise<boolean> {
  return new Promise((resolve) => {
    if (Class.is_authorised) return resolve(true);
    const interval = setInterval(() => {
      if (!Class.is_authorised) return;
      clearInterval(interval);
      resolve(true);
    }, 100);
  });
}

export function poll_for_auth(
  this: authorise_t,
  Class: Authorise_t,
): Promise<boolean> {
  if (Class.is_authorised) return Promise.resolve(true);
  const poll = poll_for_auth.bind(this, Class);

  return this.is_authorised()
    .then((success) => {
      Class.is_authorised = success;
      if (!success) throw Error();
      keep_auth_alive.bind(this, Class)();
      return true;
    })
    .catch(
      () => new Promise((resolve) => setTimeout(() => resolve(poll()), 100)),
    );
}

function keep_auth_alive(this: authorise_t, Class: Authorise_t) {
  const interval = Class.keepalive_interval;
  this.is_authorised()
    .then((success) => {
      Class.is_authorised = success;
      if (!success) throw Error();
      setTimeout(() => keep_auth_alive.bind(this, Class)(), interval);
    })
    .catch(() => poll_for_auth.bind(this, Class)());
}
