import { Global } from "@backend/Global";

export class Transactions extends Global {
  constructor(private _broker: broker_t) {
    super();
  }

  public transctns_update_date = async () => {
    const last_date = await this.db.select.transctns_update_date(this._broker);
    const is_init = !last_date;
    let days = is_init ? undefined : util.time.aging_days(last_date);
    const date = !!last_date
      ? util.time.epoch.to_iso_date(last_date)
      : undefined;
    if (!is_init) days = days && days > 0 ? days : 1;
    return { is_init, days, date };
  };
}
