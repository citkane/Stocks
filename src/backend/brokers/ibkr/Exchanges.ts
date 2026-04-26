import { Exchanges as _Exchanges } from "@backend/brokers/common";

export class Exchanges extends _Exchanges {
  public tv = (code: string, country: string) => {
    const tv = this.exchg(code, country).tv;
    if (!tv || tv === null)
      logger.warn(
        `No TV exchange found for IBKR ${code}.${country}`,
        "Reverting to MIC code",
      );
    return tv ? tv : this.mic(code, country);
  };
  public mic = (code: string, country: string) => {
    const mic = this.exchg(code, country).mic;
    if (!mic || mic === null)
      logger.warn(
        `No MIC exchange found for IBKR ${code}.${country}`,
        "Reverting to broker code",
      );
    return mic ? mic : code;
  };

  private exchg = (code: string, country: string): b.exchange_t => {
    const noop = { tv: null, mic: null };
    if (!code || !country) return noop;

    const key = `${code}.${country}`;
    const exchg = this.tv_exchange_map.ibkr[key];

    const last_char = code[code.length - 1]!;
    if (!exchg && country === "HK" && code.startsWith("SEHK")) {
      return this.exchg(code, "CN");
    }
    if (!exchg && !isNaN(Number(last_char))) {
      const truncated = code.slice(0, code.length - 1);
      return this.exchg(truncated, country);
    }

    return exchg ? exchg : noop;
  };
}
