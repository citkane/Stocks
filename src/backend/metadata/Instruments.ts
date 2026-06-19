//import { TradingView } from "@backend/index";

import { Global } from "@backend/Global";

export class Instruments extends Global {
  //extends TradingView {
  //constructor() {
  //  super();
  //  this.add_shutdown_fncs(TradingView.close);
  //}

  //public update = async () => {
  //  const all_i_ids = this.brokers.cache.i_ids;
  //  const ex_i_ids = await this.brokers.cache.instruments
  //    .then(Object.keys)
  //    .catch((_err) => [] as string[]);
  //  const update_i_ids = all_i_ids.filter((i_id) => !ex_i_ids.includes(i_id));
  //  // await this.scrape_instruments(update_i_ids);
  //
  //  this.bootstrap("Instruments updated.");
  //};

  public live_data = async () => {
    try {
      //const positions = Object.values(this.brokers.cache.positions);
      //const data = await this.fetch_live_data(positions);
      //this.brokers.cache.live_data_data = data;
      this.bootstrap("Live data updated.");
    } catch (err) {
      logger.error(err);
    }
  };
}
