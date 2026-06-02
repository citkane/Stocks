import { Auth, Fetch } from "@backend/brokers/common";
import type { BrokerIbkr } from "../BrokerIbkr";
import type { BrokerSaxo } from "../BrokerSaxo";

export class Broker extends Fetch {
  constructor(
    rate_limit: number,
    params_factory: () => RequestInit,
    tls?: { tls: { [key: string]: any } },
  ) {
    super(rate_limit, params_factory, tls);
  }

  public await_auth!: () => Promise<void>;
  public revoke_auth!: () => void;
  public logout!: () => Promise<void>;
  public chart_data!: (..._p: p.chart_period) => Promise<chart_data_t[] | void>;
  public update!: {
    fx?: () => Promise<void>;
    accounts: () => Promise<void>;
    transactions: () => Promise<void>;
    positions: () => Promise<void>;
    account_balances: () => Promise<void>;
  };
  public get auth_state(): boolean {
    return false;
  }
  public get broker_auth() {
    return {} as Auth;
  }

  protected _update!: {
    fx?: (rates: fx_rates_t) => void;
    accounts: (accounts: b.s.account_t[] & b.i.account_t[]) => void;
    transactions: () => Promise<void>;
  };

  public what_err(this: BrokerIbkr | BrokerSaxo, err: any) {
    const status =
      err instanceof Object &&
      (err as Object).hasOwnProperty("status") &&
      typeof err.status === "number"
        ? (err.status as number)
        : 500;

    switch (status) {
      case 401:
        this.revoke_auth();
        console.error(err);
        return;
      case 500:
        console.error(err);
        throw Error(err);
        break;
      default:
        console.error(err);
    }
  }

  protected auth_resolver?: Promise<void>;
}
