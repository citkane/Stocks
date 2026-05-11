import { Auth } from "@backend/brokers/common/Auth";
//import { $ } from "bun";

const ping_auth_interval = 60000;

export class AuthIbkr extends Auth {
  constructor() {
    super("ibkr", ping_auth_interval);
  }

  public is_authorised = () => this.renew_auth();
  public login = async () => {
    let { url, params } = this.ibkr.endpoints.post.init_broker();
    await this.ibkr.fetch(url, params).then((data) => logger.info(data));
  };
  public logout = async () => {
    //if (!this.auth_state) return;
    {
      let { url, params } = this.ibkr.endpoints.post.logout();
      await this.ibkr.fetch(url, params);
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

    return this.ibkr
      .fetch<b.i.tickle_t>(this.ibkr.endpoints.get.tickle())
      .then((tickle) => tickle.iserver.authStatus.authenticated)
      .catch((_err) => {
        return false;
      });
  };
}
