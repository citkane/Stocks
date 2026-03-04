import { Init } from "@frontend/app/Init";

export type topic_set_t = keyof InstanceType<typeof Api>["set"];
export type topic_req_t = keyof InstanceType<typeof Api>["request"];

export class Api extends Init implements Api_t {
  constructor() {
    super();
  }
  request = {
    topics: (p: req_t) => p.messenger.response(p.req_uid, this.topics),
  };
  set = {
    backend_ready: () => this.brokers!.is_data_ready(),
    authorised: (success: boolean, broker: broker_t) =>
      this.brokers.set_broker_authorised(success, broker),
    position: (position: position_t) => this.brokers.position(position),
    account: (account: account_t) => this.brokers.account(account),
    shutdown: () => window.close(),
  };

  private get topics() {
    return Object.keys(this.set);
  }
}
