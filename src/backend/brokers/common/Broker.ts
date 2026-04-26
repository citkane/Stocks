import { AuthBase, Fetch } from "@backend/brokers/common";

export class Broker extends Fetch {
  constructor(
    rate_limit: number,
    params_factory: () => RequestInit,
    tls?: { tls: { [key: string]: any } },
  ) {
    super(rate_limit, params_factory, tls);
  }

  public await_auth!: () => Promise<void>;
  public chart_data!: (..._p: p.chart_period) => Promise<chart_data_t[]>;
  public update!: {
    fx?: () => Promise<void>;
    accounts: () => Promise<void>;
    transactions: () => Promise<void>;
    positions: () => Promise<void>;
  };
  public get is_authorised(): boolean {
    return false;
  }
  public get auth() {
    return {} as AuthBase;
  }

  protected _update!: {
    fx?: (rates: fx_rates_t) => void;
    accounts: (accounts: b.s.account_t[] & b.i.account_t[]) => void;
    transactions: () => Promise<void>;
  };
}
