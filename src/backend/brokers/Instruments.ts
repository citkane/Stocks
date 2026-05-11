import { Global } from "@backend/Global";
import { TradingView } from "@backend/brokers/index";

export class Instruments extends Global {
  constructor() {
    super();
    this.add_shutdown_fncs(TradingView.close);
  }

  public update = async () => {
    try {
      const i_ids = await this.i_ids_to_update();
      const postns = i_ids.map((i_id) => this.brokers.cache.positions[i_id]);
      const instrmnts: instrmnt_t[] = (await this.tv.instruments(i_ids)).map(
        (data, i) => {
          const pos = postns[i]!;
          const { saxo_id, ibkr_id, description, currency } = pos;
          if (typeof data === "object")
            return { ...data, ...{ saxo_id, ibkr_id } };

          logger.info("Not found:", data);
          const [exchange, ticker] = data.split("-") as [string, string];
          return {
            i_id: data,
            exchange,
            ticker,
            description,
            currency,
            saxo_id,
            ibkr_id,
          };
        },
      );
      await this.brokers.cache.set_instruments(instrmnts);
      this.bootstrap("Instruments updated.");
    } catch (err) {
      logger.error(err);
    }
  };

  public live_data = async () => {
    try {
      const positions = Object.values(this.brokers.cache.positions);
      const data = await this.tv.live_data(positions);
      this.brokers.cache.live_data_data = data;
      this.bootstrap("Live data updated.");
    } catch (err) {
      logger.error(err);
    }
  };

  private async i_ids_to_update() {
    let ex_i_ids: i_id_t[] = [];
    try {
      const instrmnts = await this.brokers.cache.instruments;
      ex_i_ids = Object.keys(instrmnts) as i_id_t[];
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
