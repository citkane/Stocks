import { Auth } from "@backend/brokers/common/Auth";
import type { EndpointsIbkr as fetch_t } from "./EndpointsIbkr";

//import { $ } from "bun";

const ping_auth_interval = 60000;

export class AuthIbkr extends Auth {
  constructor(
    private fetch: fetch_t["fetch"],
    private get: fetch_t["get"],
    private post: fetch_t["post"],
  ) {
    super("ibkr", ping_auth_interval);
  }

  public is_authorised = () => this.renew_auth();
  public login = async () => {
    const req = this.post.init_broker();
    await this.fetch(req).then((data) => logger.info(data));
  };
  public logout = async () => {
    //if (!this.auth_state) return;
    {
      const req = this.post.logout();
      await this.fetch(req);
    }

    //{
    //  let { url, params } = this.ibkr.endpoints.post.auth_status();
    //  await this.ibkr.fetch(url, params).then((data) => logger.info(data));
    //}
    //await this.ibkr
    //  .fetch(this.ibkr.endpoints.get.validate_sso())
    //  .then((data) => logger.info(data));
    //{
    //  let { url, params } = this.ibkr.endpoints.post.init_broker();
    //  logger.info(url, params);
    //  await this.ibkr.fetch(url, params).then((data) => logger.info(data));
    //}
    //await $`bash -c '
    //  source ./src/scripts/app.sh
    //  ibkr_stop
    //'`;
    //await $`bash -c '
    //  source ./src/scripts/app.sh
    //  ibkr_start
    //'`;

    //const { url, params } = this.ibkr.endpoints.post.logout();
    //return this.ibkr
    //  .fetch(url, params)
    //  .then(() => logger.info("IBKR logged out"));
  };

  //public session_token = () => {
  //  return this.ibkr
  //    .fetch<b.i.tickle_t>(this.ibkr.endpoints.get.tickle())
  //    .then((tickle) => tickle.session);
  //};
  private renew_auth = () => {
    logger.debug("Renew auth", "ibkr");
    const req = this.get.tickle();
    return this.fetch<b.i.tickle_t>(req)
      .then((tickle) => tickle.iserver.authStatus.authenticated)
      .catch((_err) => {
        return false;
      });
  };
}
