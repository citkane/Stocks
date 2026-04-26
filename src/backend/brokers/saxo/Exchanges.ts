import { Exchanges as _Exchanges } from "@backend/brokers/common";

export class Exchanges extends _Exchanges {
  public tv = (code: string) => {
    const tv = this.exchg(code).tv;
    if (!tv || tv === null)
      logger.warn(
        `No TV exchange found for SAXO ${code}`,
        "Reverting to MIC code",
      );
    return tv ? tv : this.mic(code);
  };
  public mic = (code: string) => {
    const mic = this.exchg(code).mic;
    if (!mic || mic === null)
      logger.warn(
        `No MIC exchange found for SAXO ${code}`,
        "Reverting to broker code",
      );
    return mic ? mic : code;
  };

  private exchg = (code: string): b.exchange_t => {
    const noop = { tv: null, mic: null };
    if (!code) return noop;

    const exchg = this.tv_exchange_map.saxo[code];

    return exchg ? exchg : noop;
  };
}
