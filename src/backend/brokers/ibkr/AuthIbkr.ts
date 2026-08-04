import { Auth } from "@backend/brokers/common/Auth";

const ping_auth_interval = 60000;

export class AuthIbkr extends Auth {
  constructor() {
    super("ibkr", ping_auth_interval);
  }
  public await_auth = async () => this.resolver(this.check_auth);
  public login = async () => {
    const { post, fetch } = this.ibkr.api;
    const { url, req_init } = post.init_broker();
    await fetch(url, req_init).then((data) => logger.info(data));
  };
  public logout = () => {
    const { post, fetch } = this.ibkr.api;
    const { url, req_init } = post.logout();
    return this.revoke_auth(fetch(url, req_init));
  };
  private check_auth = async () => {
    // const { post, fetch } = this.ibkr.api;
    // const { url, req_init } = post.auth_status();
    // console.log({ url, req_init });
    // return fetch(url, req_init)
    //   .then((res) => console.log({ res }))
    //   .then(() => false)
    //   .catch((err) => {
    //     console.log(err);
    //     return false;
    //   });
    const { get, fetch } = this.ibkr.api;
    const { url, req_init } = get.tickle();
    return fetch<b.i.tickle_t>(url, req_init)
      .then((tickle) => tickle.iserver.authStatus.authenticated)
      .catch((err) => {
        console.error(url, err);
        return false;
      });
  };
}
