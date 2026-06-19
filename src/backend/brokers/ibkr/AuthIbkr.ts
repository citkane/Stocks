import { Auth } from "@backend/brokers/common/Auth";
import { Global } from "@backend/Global";

const ping_auth_interval = 60000;

export class AuthIbkr extends Global {
  constructor() {
    super();
    this.auth = new Auth("ibkr", ping_auth_interval);
  }
  public await_auth = async () => {
    return this.auth_state
      ? Promise.resolve()
      : this.auth.resolver || this.auth.define_resolver();
  };
  public is_authorised = () => this.renew_auth();
  public login = async () => {
    const { post, fetch } = this.ibkr.api;
    const { url, req_init } = post.init_broker();
    await fetch(url, req_init).then((data) => logger.info(data));
  };
  public logout = async () => {
    if (!this.auth_state) return;
    const { post, fetch } = this.ibkr.api;
    const { url, req_init } = post.logout();
    await fetch(url, req_init);
    this.auth.revoke_auth();
  };

  //public session_token = () => {
  //  return this.ibkr
  //    .fetch<b.i.tickle_t>(this.ibkr.endpoints.get.tickle())
  //    .then((tickle) => tickle.session);
  //};
  private renew_auth = () => {
    logger.debug("Renew auth", "ibkr");
    const { get, fetch } = this.ibkr.api;

    const { url, req_init } = get.tickle();
    //const res_handler = async (_frm_req: frm_req_t, res: Response) => {
    //  const data = await res.json();
    //  console.log(data);
    //  return data;
    //};

    return fetch<b.i.tickle_t>(url, req_init) //, { res_handler })
      .then((tickle) => tickle.iserver.authStatus.authenticated)
      .catch((err) => {
        console.error(err);
        return false;
      });
  };
  public auth: Auth;
  public get auth_state() {
    return this.auth.auth_state;
  }
}
