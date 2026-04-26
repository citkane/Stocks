import { Global } from "@backend/Global";
import { TradingView } from "@backend/brokers/common/TradingView";

export class Instruments extends Global {
  constructor() {
    super();
    this.add_shutdown_fncs(TradingView.close);
  }

  public update = async () => {
    const i_ids = await this.i_ids_to_update();
    const instrmnts = this.tv.instruments(i_ids);
    await this.brokers.cache.set_instruments(instrmnts);
    logger.info("Instruments updated.");
  };

  public live_data = async () => {
    const fx = await this.ibkr.fx();

    const positions = Object.values(this.brokers.cache.positions);
    return await this.tv.live_data(positions, fx);
  };

  private async i_ids_to_update() {
    let ex_i_ids: i_id_t[] = [];
    try {
      const instrmnts = await this.brokers.cache.instruments;
      ex_i_ids = instrmnts.map((i) => `${i.ticker}_${i.exchange}` as i_id_t);
    } catch (_err) {
      return this.brokers.cache.i_ids;
    }
    const to_update = this.brokers.cache.i_ids.filter(
      (i_id) => !ex_i_ids.includes(i_id),
    );
    return to_update;
  }

  private tv = new TradingView();
}
